import QtQuick
import Quickshell
import qs.Services
import "calculator.js" as Calculator
import "."

QtObject {
    id: root

    property var pluginService: null
    property string pluginId: "calculator"
    property string trigger: ""
    property string calcEngine: "default"
    property string lastSentQuery: ""
    property var history: []
    property int keepLastResults: 10

    signal itemsChanged

    property Connections qalcConn: Connections {
        target: QalcService
        enabled: root.calcEngine === "qalc"
        function onResultReady(result) {
            if (!root.pluginService || !root.pluginId)
                return;
            if (typeof root.pluginService.requestLauncherUpdate === "function") {
                root.pluginService.requestLauncherUpdate(root.pluginId);
            }
        }
    }

    Component.onCompleted: {
        if (!pluginService)
            return;
        trigger = pluginService.loadPluginData("calculator", "trigger", "=");
        calcEngine = pluginService.loadPluginData("calculator", "calcEngine", "default");
        keepLastResults = parseInt(pluginService.loadPluginData("calculator", "keepLastResults", "10")) || 10;
        QalcService.qalcCommand = pluginService.loadPluginData("calculator", "qalcCommand", "qalc -i -t -set \"decimal comma off\" -c 0");
        QalcService.active = (calcEngine === "qalc");
    }

    function addToHistory(expression, result) {
        if (history.length > 0 && history[0].expression === expression && history[0].result === result)
            return;
        var filtered = history.filter(function(entry) {
            return entry.expression !== expression;
        });
        var updated = [{expression: expression, result: result}].concat(filtered);
        if (updated.length > keepLastResults)
            updated = updated.slice(0, keepLastResults);
        history = updated;
    }

    function getHistoryItems() {
        if (history.length === 0)
            return [];
        return history.map(function(entry) {
            return {
                name: entry.result,
                icon: "material:history",
                comment: entry.expression + " = " + entry.result,
                action: "copy:" + entry.result,
                categories: ["Calculator"]
            };
        });
    }

    function getItems(query) {
        if (!query || query.trim().length === 0)
            return getHistoryItems();

        const trimmedQuery = query.trim();

        if (calcEngine === "qalc") {
            return getItemsQalc(trimmedQuery);
        }

        return getItemsDefault(trimmedQuery);
    }

    function getItemsDefault(trimmedQuery) {
        if (!Calculator.isMathExpression(trimmedQuery))
            return [];

        const result = Calculator.evaluate(trimmedQuery);
        if (!result.success)
            return [];

        let resultString = result.result.toString();
        if (typeof result.result === 'number') {
            if (resultString.length > 15 && Math.abs(result.result) >= 1e6) {
                resultString = result.result.toExponential(6);
            } else if (resultString.length > 15 && Math.abs(result.result) < 1e-6) {
                resultString = result.result.toExponential(6);
            }
        }

        return [
            {
                name: resultString,
                icon: "material:equal",
                comment: trimmedQuery + " = " + resultString,
                action: "copy:" + resultString,
                categories: ["Calculator"]
            }
        ];
    }

    function getItemsQalc(trimmedQuery) {
        if (trimmedQuery !== lastSentQuery) {
            QalcService.lastResult = "";
            QalcService.calculate(trimmedQuery);
            lastSentQuery = trimmedQuery;
        }

        const result = QalcService.lastResult;

        if (!result) {
            return [{
                name: "Calculating...",
                icon: "material:calculate",
                comment: trimmedQuery,
                action: "none",
                categories: ["Calculator"]
            }];
        }

        return [{
            name: result,
            icon: "material:calculate",
            comment: trimmedQuery + " = " + result,
            action: "copy:" + result,
            categories: ["Calculator"]
        }];
    }

    function executeItem(item) {
        if (!item?.action)
            return;
        const actionParts = item.action.split(":");
        const actionType = actionParts[0];
        const actionData = actionParts.slice(1).join(":");

        switch (actionType) {
        case "copy":
            copyToClipboard(actionData);
            if (item.comment) {
                var eqIdx = item.comment.indexOf(" = ");
                if (eqIdx !== -1)
                    addToHistory(item.comment.substring(0, eqIdx), actionData);
            }
            break;
        default:
            showToast("Unknown action: " + actionType);
        }
    }

    function copyToClipboard(text) {
        Quickshell.execDetached(["sh", "-c", "echo -n '" + text + "' | wl-copy"]);
        showToast("Copied to clipboard: " + text);
    }

    function showToast(message) {
        if (typeof ToastService !== "undefined") {
            ToastService.showInfo("Calculator", message);
        }
    }

    onTriggerChanged: {
        if (!pluginService)
            return;
        pluginService.savePluginData("calculator", "trigger", trigger);
    }

    onCalcEngineChanged: {
        if (!pluginService)
            return;
        pluginService.savePluginData("calculator", "calcEngine", calcEngine);
    }
}
