## Error: `Package 'vips', required by 'virtual:world', not found`

### **What Happened**

When building or running the Go service with the [`bimg`](https://github.com/h2non/bimg) library, the following error appeared:

```bash
Package vips was not found in the pkg-config search path.
Perhaps you should add the directory containing `vips.pc`
to the PKG_CONFIG_PATH environment variable
Package 'vips', required by 'virtual:world', not found

```

This error occurs because `bimg` depends on the native **libvips** library, which was not installed on the system.

---

### **How We Fixed It**

We installed the missing dependency by running:

```bash
sudo apt-get update
sudo apt-get install -y libvips-dev
```

---

### **Why This Works**

- `libvips-dev` provides the system libraries and headers needed by `bimg` for fast image processing.
    
- Installing it ensures Go can build and run the microservice without missing dependency errors.
    

---

**Summary:**  
If you see this error, install `libvips-dev` so your Go image service can use the `bimg` library for image uploads and processing.

--- --------------------------------------------------------------------

## Error: `github.com/h2non/bimg: exec: "pkg-config": executable file not found in $PATH`

### **What Happened**

When running or building the Go service using the [`bimg`](https://github.com/h2non/bimg) library,  
the following error appeared:

```bash
github.com/h2non/bimg: exec: "pkg-config": executable file not found in $PATH
```

This error means the required **`pkg-config` utility** is missing from your system.  
`pkg-config` is used to locate C libraries and headers (`libvips` in this case) at build time.

---

### **How We Fixed It**

We installed the missing tool by running:

```bash
sudo apt-get update
sudo apt-get install -y pkg-config
```

---

### **Why This Works**

- `pkg-config` allows Go (and the bimg/libvips ecosystem) to find the proper build flags and include paths for native libraries.
    
- It is essential for any Go/C/C++ project that wraps system libraries.
    

---

**Summary:**  
If you see this error, just install `pkg-config` and rerun your Go command.  
You’ll need this any time you use a Go package that depends on a C library (like `bimg`/`libvips`).