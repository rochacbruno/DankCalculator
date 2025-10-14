// QalcState - Global state management for qalc evaluation
.pragma library

// Store results per query: { "query": {result: "...", pending: bool, error: bool} }
var results = {}

function getResult(query) {
    if (results[query]) {
        return results[query].result || ""
    }
    return ""
}

function isPending(query) {
    if (results[query]) {
        return results[query].pending || false
    }
    return false
}

function hasError(query) {
    if (results[query]) {
        return results[query].error || false
    }
    return false
}

function setResult(query, result) {
    if (!results[query]) {
        results[query] = {}
    }
    results[query].result = result
    results[query].pending = false
    results[query].error = false
}

function setPending(query, pending) {
    if (!results[query]) {
        results[query] = {}
    }
    results[query].pending = pending
}

function setError(query, error) {
    if (!results[query]) {
        results[query] = {}
    }
    results[query].error = error
    results[query].pending = false
}

function reset() {
    results = {}
}
