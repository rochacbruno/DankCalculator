import QtQuick
import Quickshell
import qs.Services
import "calculator.js" as Calculator

Item {
    id: root

    // Plugin properties
    property var pluginService: null
    property string trigger: ""

    // Plugin interface signals
    signal itemsChanged()

    Component.onCompleted: {
        console.log("Calculator: Plugin loaded")

        // Load custom trigger from settings (default is "=")
        if (pluginService) {
            trigger = pluginService.loadPluginData("calculator", "trigger", "=")
        }
    }

    // Required function: Get items for launcher
    function getItems(query) {
        console.log("Calculator: getItems called with query:", query)

        // If query is empty, return nothing
        if (!query || query.trim().length === 0) {
            return []
        }

        const trimmedQuery = query.trim()

        // Check if it looks like a math expression
        if (!Calculator.isMathExpression(trimmedQuery)) {
            return []
        }

        // Try to evaluate the expression
        const result = Calculator.evaluate(trimmedQuery)

        if (!result.success) {
            // Don't show error items, just return empty
            return []
        }

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

        return [
            {
                name: resultString,
                icon: "material:equal",
                comment: trimmedQuery + " = " + resultString,
                action: "copy:" + resultString,
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
        Quickshell.execDetached(["sh", "-c", "echo -n '" + text + "' | wl-copy"])
        showToast("Copied to clipboard: " + text)
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
