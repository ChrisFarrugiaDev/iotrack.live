# The buffered-channel semaphore pattern

Where it's used: `internal/api/handlers/report_handler.go` — the `sem` field
on `ReportHandler` limits how many activity reports compute at the same time
(`REPORT_MAX_CONCURRENT`, default 4).

## The problem

Go's HTTP server runs every request in its own goroutine. 50 users clicking
"Generate" at once = 50 goroutines each about to scan days of telemetry.
Nothing stops all 50 hammering the database together. We want: **at most 4
compute at a time, the rest wait in line, nobody gets an error.**

## The trick: a buffered channel as a bag of tickets

```go
sem := make(chan struct{}, 4)   // a box that can hold at most 4 balls
```

Go's channel rules do all the work:

- sending into a channel **with free space** succeeds immediately;
- sending into a **full** channel **blocks** (the goroutine waits) until
  someone takes a value out;
- receiving takes one value out, which unblocks one waiting sender.

So: put a ball in = take a slot. Take a ball out = free a slot. The channel's
capacity IS the concurrency limit, and the blocking IS the queue.

## The syntax, token by token

### `struct{}{}` — a value of "nothing"

```go
struct{}     // a TYPE: a struct with no fields
struct{}{}   // a VALUE of that type: one blank token
```

Compare with a normal struct: `Point{X: 5}` is type `Point`, value `{5}`.
`struct{}{}` is type `struct{}`, value `{}` — nothing in it. We could send
`true` or `0` instead, but those occupy memory and we never read the values —
only the *count* in the channel matters. `struct{}` is zero bytes and is the
idiomatic way to say "this channel carries signals, not data".

### `h.sem <- struct{}{}` — put a token in

`ch <- value` is a channel send: "put one blank token into the box."
Fewer than 4 inside → succeeds now. Already 4 → waits.

### `case h.sem <- struct{}{}:` — a send as a select case

A `select` case can be a **send**, not just a receive. This case fires at
the moment the send is able to succeed — i.e. the moment a slot frees up:

> "WHEN I manage to put my token in: run the body."

### `defer func() { <-h.sem }()` — schedule giving it back

Inside-out:

```go
<-h.sem              // take one token OUT = free my slot
func() { <-h.sem }   // wrap it in a tiny anonymous function
defer ...()          // run it when the surrounding function RETURNS
```

`defer` runs the function on **every** exit path — the handler has six
(success, 404, 403, 400, canceled, 500). One `defer` replaces six manual
releases, and forgetting a single manual release would leak a slot forever:
after four leaks the service deadlocks, every report queuing eternally.

The `func(){...}()` wrapper exists because `defer` needs a *function call*;
`defer <-h.sem` is a syntax error (a receive is an operation, not a call).

## The full select

```go
select {
case h.sem <- struct{}{}:        // ① a slot freed up → take it
	defer func() { <-h.sem }()   //    and give it back on any exit
case <-r.Context().Done():       // ② client hung up while queuing
	return                       //    → leave the queue, compute nothing
}
```

`select` waits on both cases at once and runs whichever becomes ready first.
Branch ② matters because a plain `h.sem <- struct{}{}` would wait forever —
even for a browser tab that closed two minutes ago. The server cancels
`r.Context()` automatically on disconnect, `ctx.Done()` is a channel that
closes at that moment, and receiving from a closed channel always succeeds.

## Timeline for the unlucky 5th request

```
requests 1-4 arrive  → each sends into sem (space) → computing
request 5 arrives    → sem full → its select blocks, watching both cases
   ...whichever happens first...
a) request 2 finishes → its defer does <-h.sem → slot free
   → request 5's case ① fires → it computes
b) request 5's user closes the tab → ctx.Done() closes
   → case ② fires → return → request 5 leaves the queue
```

Edge case: if the client disconnects *after* taking the slot (mid-compute),
case ② is no longer watching — but the same context flows into the service
and the DB query, so the query cancels, the handler's `context.Canceled`
branch writes nothing, and the `defer` still frees the slot on the way out.

## Equivalent verbose version (same logic, no select)

```go
h.sem <- struct{}{}          // grab a slot (blocks until one is free)
defer releaseSlot(h.sem)     // promise to release on ANY exit

func releaseSlot(sem chan struct{}) {
	<-sem
}
```

The real code adds only the `select`, for the disconnect-while-queuing case.

Library alternative: `golang.org/x/sync/semaphore` does the same with
weights and context support built in — worth it for dynamic limits; overkill
for a fixed small cap, where the buffered channel is conventional Go.
