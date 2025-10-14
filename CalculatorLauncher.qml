import QtQuick
import qs.Services
import qs.Common
import "calculator.js" as Calculator
import "qalc_state.js" as QalcState

Item {
    id: root

    // Plugin properties
    property var pluginService: null
    property string trigger: ""
    property bool useQalc: false
    property int qalcDebounceMs: 100
    property var emitCallback: function() {
        if (root) {
            root.itemsChanged()
        }
    }

    // Plugin interface signals
    signal itemsChanged()

    // Timer to aggressively force UI updates when qalc results arrive
    Timer {
        id: pollTimer
        interval: 5  // Poll every 5ms
        repeat: true
        running: false
        property string watchQuery: ""
        property int emitCount: 0

        onTriggered: {
            const result = QalcState.getResult(watchQuery)
            if (result.length > 0) {
                console.error("Calculator: Result ready for", watchQuery, "- forcing update #" + emitCount)
                root.itemsChanged()
                emitCount++

                // Keep trying for 500ms (100 attempts)
                if (emitCount > 100) {
                    console.error("Calculator: Stopping poll after 100 attempts")
                    stop()
                    emitCount = 0
                    watchQuery = ""
                }
            }
        }

        function watchFor(query) {
            watchQuery = query
            emitCount = 0
            restart()
        }
    }

    Component.onCompleted: {
        console.log("Calculator: Plugin loaded")

        // Load settings
        if (pluginService) {
            trigger = pluginService.loadPluginData("calculator", "trigger", "=")
            useQalc = pluginService.loadPluginData("calculator", "useQalc", false)
            qalcDebounceMs = pluginService.loadPluginData("calculator", "qalcDebounceMs", 0)
        }
    }

    // Required function: Get items for launcher
    function getItems(query) {
        console.error("Calculator: getItems called with query:", query, "useQalc:", useQalc)

        // If query is empty, return nothing
        if (!query || query.trim().length === 0) {
            console.error("Calculator: Empty query, returning []")
            return []
        }

        const trimmedQuery = query.trim()

        // If using qalc, handle it differently
        if (useQalc) {
            console.error("Calculator: Using qalc mode for query:", trimmedQuery)
            return getItemsWithQalc(trimmedQuery)
        }

        console.error("Calculator: Using built-in calculator.js for query:", trimmedQuery)

        // Use built-in calculator.js
        // Check if it looks like a math expression
        if (!Calculator.isMathExpression(trimmedQuery)) {
            console.error("Calculator: Not a math expression:", trimmedQuery)
            return []
        }

        // Try to evaluate the expression
        const result = Calculator.evaluate(trimmedQuery)

        if (!result.success) {
            console.error("Calculator: Evaluation failed:", result.error)
            return []
        }

        console.error("Calculator: Evaluation succeeded:", result.result)

        // Format the result nicely
        let resultString = result.result.toString()

        // Only apply scientific notation formatting for actual numbers, not BigInt strings
        if (typeof result.result === 'number') {
            // For very long decimals or very large/small numbers, use scientific notation
            if (resultString.length > 15 && Math.abs(result.result) >= 1e6) {
                resultString = result.result.toExponential(6)
            } else if (resultString.length > 15 && Math.abs(result.result) < 1e-6) {
                resultString = result.result.toExponential(6)
            }
        }
        // For BigInt string results, use as-is (already formatted)

        console.error("Calculator: Returning result item:", resultString)

        return [
            {
                name: resultString,
                icon: "accessories-calculator",
                comment: trimmedQuery + " = " + resultString,
                action: "copy:" + resultString,
                categories: ["Calculator"]
            }
        ]
    }

    // Handle qalc evaluation - NO CACHING, each query gets its own result
    function getItemsWithQalc(query) {
        const normalizedQuery = query.trim()
        console.error("Calculator: getItemsWithQalc for:", normalizedQuery)

        // Check if we have a result for THIS EXACT query
        const result = QalcState.getResult(normalizedQuery)
        const pending = QalcState.isPending(normalizedQuery)
        const error = QalcState.hasError(normalizedQuery)

        console.error("Calculator: Query state - result:", result, "pending:", pending, "error:", error)

        // If we have a result for this query, return it
        if (result.length > 0) {
            console.error("Calculator: Returning result for", normalizedQuery, ":", result)
            return [
                {
                    name: result,
                    icon: "accessories-calculator",
                    comment: normalizedQuery + " = " + result + " (qalc)",
                    action: "copy:" + result,
                    categories: ["Calculator"]
                }
            ]
        }

        // If evaluation is pending, show indicator
        if (pending) {
            console.error("Calculator: Evaluation pending for:", normalizedQuery)
            return []  // Empty while calculating
        }

        // No result yet and not pending - start evaluation
        console.error("Calculator: Starting NEW evaluation for:", normalizedQuery)
        QalcState.setPending(normalizedQuery, true)

        // Start poll timer to force UI updates when result arrives
        pollTimer.watchFor(normalizedQuery)

        Proc.runCommand("calculator-qalc-" + normalizedQuery, ["qalc", "-t", normalizedQuery], function(output, exitCode) {
            console.error("Calculator: qalc finished for:", normalizedQuery, "exitCode:", exitCode, "output:", output)

            if (exitCode !== 0) {
                console.error("Calculator: qalc FAILED for:", normalizedQuery)
                QalcState.setError(normalizedQuery, true)
                pollTimer.stop()
                return
            }

            const result = output.trim()
            if (result.length > 0) {
                console.error("Calculator: qalc SUCCESS for:", normalizedQuery, "=", result)
                QalcState.setResult(normalizedQuery, result)
                // Poll timer will keep trying to update UI
            }
        }, qalcDebounceMs)

        // Show calculating indicator while waiting
        return [
            {
                name: "⏳ Calculating...",
                icon: "accessories-calculator",
                comment: "Evaluating: " + normalizedQuery,
                action: "none",
                categories: ["Calculator"]
            }
        ]
    }

    // Required function: Execute item action
    function executeItem(item) {
        if (!item || !item.action) {
            console.warn("Calculator: Invalid item or action")
            return
        }

        console.log("Calculator: Executing item:", item.name, "with action:", item.action)

        const actionParts = item.action.split(":")
        const actionType = actionParts[0]
        const actionData = actionParts.slice(1).join(":")

        switch (actionType) {
            case "copy":
                copyToClipboard(actionData)
                break
            default:
                console.warn("Calculator: Unknown action type:", actionType)
                showToast("Unknown action: " + actionType)
        }
    }

    // Helper function to copy to clipboard
    function copyToClipboard(text) {
        if (typeof globalThis !== "undefined" && globalThis.clipboard) {
            globalThis.clipboard.setText(text)
            showToast("Copied to clipboard: " + text)
        } else {
            console.log("Calculator: Clipboard not available, result:", text)
            showToast("Result: " + text)
        }
    }

    // Helper function to show toast notification
    function showToast(message) {
        if (typeof ToastService !== "undefined") {
            ToastService.showInfo("Calculator", message)
        } else {
            console.log("Calculator Toast:", message)
        }
    }

    // Watch for trigger changes
    onTriggerChanged: {
        if (pluginService) {
            pluginService.savePluginData("calculator", "trigger", trigger)
        }
    }
}
