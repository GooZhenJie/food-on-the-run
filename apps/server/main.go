package main

import (
	"fmt"
	"net/http"
)

func main() {
	fmt.Println("Server is running on http://localhost:8080")
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, Food on the Run!")
	})
	http.ListenAndServe(":8080", nil)
}
