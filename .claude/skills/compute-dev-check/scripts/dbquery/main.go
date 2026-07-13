// dbquery runs one SQL statement against DB_URL and prints the result.
// Rows come out tab-separated with a header; statements without rows
// (INSERT, UPDATE, ...) print their command tag. Use via dbquery.sh.
package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/jackc/pgx/v5"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: dbquery <sql>")
		os.Exit(1)
	}

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, os.Getenv("DB_URL"))
	if err != nil {
		fmt.Fprintln(os.Stderr, "connect:", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	rows, err := conn.Query(ctx, os.Args[1])
	if err != nil {
		fmt.Fprintln(os.Stderr, "query:", err)
		os.Exit(1)
	}
	defer rows.Close()

	fields := rows.FieldDescriptions()
	if len(fields) > 0 {
		names := make([]string, len(fields))
		for i, f := range fields {
			names[i] = f.Name
		}
		fmt.Println(strings.Join(names, "\t"))
	}

	count := 0
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			fmt.Fprintln(os.Stderr, "scan:", err)
			os.Exit(1)
		}
		cells := make([]string, len(values))
		for i, v := range values {
			if v == nil {
				cells[i] = "NULL"
			} else {
				cells[i] = fmt.Sprint(v)
			}
		}
		fmt.Println(strings.Join(cells, "\t"))
		count++
	}
	if err := rows.Err(); err != nil {
		fmt.Fprintln(os.Stderr, "rows:", err)
		os.Exit(1)
	}

	fmt.Fprintf(os.Stderr, "(%d rows, %s)\n", count, rows.CommandTag())
}
