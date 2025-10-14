// QalcState - Global state management for qalc evaluation
.pragma library

var currentQuery = ""
var result = ""
var pending = false
var error = false

function setQuery(query) {
    currentQuery = query
}

function getQuery() {
    return currentQuery
}

function setResult(res) {
    result = res
}

function getResult() {
    return result
}

function setPending(val) {
    pending = val
}

function isPending() {
    return pending
}

function setError(val) {
    error = val
}

function hasError() {
    return error
}

function reset() {
    currentQuery = ""
    result = ""
    pending = false
    error = false
}
