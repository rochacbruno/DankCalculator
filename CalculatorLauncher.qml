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

    Component.onCompleted: {
        console.log("Calculator: Plugin loaded")

        // Load settings
        if (pluginService) {
            trigger = pluginService.loadPluginData("calculator", "trigger", "=")
            useQalc = pluginService.loadPluginData("calculator", "useQalc", false)
            qalcDebounceMs = pluginService.loadPluginData("calculator", "qalcDebounceMs", 100)
        }
    }

    // Required function: Get items for launcher
    function getItems(query) {
        console.error("Calculator: getItems called with query:", query, "useQalc:", useQalc)

        // If query is empty, return nothing
        if (!query || query.trim().length === 0) {
            QalcState.reset()
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

    // Handle qalc evaluation with debouncing
    function getItemsWithQalc(query) {
        console.error("Calculator: getItemsWithQalc called with query:", query)
        console.error("Calculator: Current state - currentQuery:", QalcState.getQuery(), "pending:", QalcState.isPending(), "result:", QalcState.getResult(), "error:", QalcState.hasError())

        // Check if we have a cached result for this exact query
        if (QalcState.getQuery() === query && !QalcState.isPending() && QalcState.getResult().length > 0 && !QalcState.hasError()) {
            console.error("Calculator: Returning cached qalc result:", QalcState.getResult())
            return [
                {
                    name: QalcState.getResult(),
                    icon: "accessories-calculator",
                    comment: query + " = " + QalcState.getResult() + " (qalc)",
                    action: "copy:" + QalcState.getResult(),
                    categories: ["Calculator"]
                }
            ]
        }

        // New query or no cached result, trigger qalc evaluation
        console.error("Calculator: Triggering new qalc evaluation for:", query)
        QalcState.setQuery(query)
        QalcState.setPending(true)
        QalcState.setError(false)
        QalcState.setResult("")

        // Capture emit callback before async operation
        const notifyUpdate = root.emitCallback

        // Trigger qalc evaluation WITHOUT debouncing (0ms = immediate)
        // The typing itself provides natural debouncing
        console.error("Calculator: Calling Proc.runCommand immediately (debounce=0)")
        Proc.runCommand("calculator-qalc", ["qalc", "-t", query], function(output, exitCode) {
            console.error("Calculator: qalc callback executed - exitCode:", exitCode, "output:", output)

            // Only use result if this query is still current
            if (query !== QalcState.getQuery()) {
                console.error("Calculator: Query changed, ignoring old result. Current:", QalcState.getQuery(), "Old:", query)
                return
            }

            console.error("Calculator: Processing qalc result for query:", query)
            QalcState.setPending(false)

            if (exitCode !== 0) {
                console.error("Calculator: qalc failed with exit code", exitCode)
                console.error("Calculator: qalc is not available or failed to evaluate expression")
                QalcState.setError(true)

                // Show error notification (only once per query change)
                if (typeof ToastService !== "undefined") {
                    ToastService.showError("Calculator", "qalc evaluation failed. Is qalc installed?")
                }

                // Try to notify UI
                console.error("Calculator: Attempting to emit itemsChanged after error")
                try {
                    notifyUpdate()
                } catch (e) {
                    console.error("Calculator: Could not emit signal:", e)
                }
                return
            }

            // qalc successful, use the result
            const result = output.trim()
            if (result.length === 0) {
                console.error("Calculator: qalc returned empty result")
                try {
                    notifyUpdate()
                } catch (e) {
                    console.error("Calculator: Could not emit signal:", e)
                }
                return
            }

            console.error("Calculator: qalc succeeded with result:", result)
            QalcState.setResult(result)
            QalcState.setError(false)

            // Notify UI that items have changed
            console.error("Calculator: Attempting to emit itemsChanged after success")
            try {
                notifyUpdate()
            } catch (e) {
                console.error("Calculator: Could not emit signal:", e)
            }
        }, 0)  // No debounce - run immediately

        // Return empty array while waiting for qalc
        console.error("Calculator: Returning empty array while waiting for qalc")
        return []
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
