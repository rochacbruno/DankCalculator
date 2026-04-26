pragma Singleton
import QtQuick
import Quickshell
import Quickshell.Io

Singleton {
    id: root
    property bool active: false
    property string qalcCommand: "qalc -i -t -set \"decimal comma off\" -c 0"
    property string lastResult: ""
    property bool failed: false
    property int _failCount: 0

    signal resultReady(string result)

    onActiveChanged: {
        _failCount = 0
        failed = false
    }

    function splitCommand(cmd) {
        var args = []
        var current = ""
        var inQuotes = false
        for (var i = 0; i < cmd.length; i++) {
            var c = cmd[i]
            if (c === '"') {
                inQuotes = !inQuotes
            } else if (c === ' ' && !inQuotes) {
                if (current.length > 0) {
                    args.push(current)
                    current = ""
                }
            } else {
                current += c
            }
        }
        if (current.length > 0)
            args.push(current)
        return args
    }

    onQalcCommandChanged: {
        if (!active)
            return;
        if (qalcProc.running) {
            qalcProc.running = false
        }
        qalcProc.running = true
    }

    Process {
        id: qalcProc
        command: ["stdbuf", "-oL"].concat(root.splitCommand(root.qalcCommand))
        running: root.active
        stdinEnabled: true

        stdout: SplitParser {
            onRead: (data) => {
                var clean = data.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").trim()
                if (clean.length > 0 && clean.indexOf(">") !== 0) {
                    root.lastResult = clean
                    root.resultReady(clean)
                }
            }
        }

        onRunningChanged: {
            if (!running && root.active) {
                root._failCount++
                if (root._failCount > 3) {
                    console.warn("Calculator: qalc process failed repeatedly, giving up. Is qalc installed?")
                    root.failed = true
                    return
                }
                console.warn("Calculator: qalc process died, retrying (" + root._failCount + "/3)...")
                retryTimer.interval = root._failCount * 1000
                retryTimer.restart()
            } else if (running) {
                root._failCount = 0
                root.failed = false
            }
        }
    }

    Timer {
        id: retryTimer
        repeat: false
        onTriggered: {
            if (root.active && !qalcProc.running)
                qalcProc.running = true
        }
    }

    property string pendingExpression: ""

    Timer {
        id: debounceTimer
        interval: 150
        onTriggered: {
            if (root.pendingExpression && qalcProc.running) {
                qalcProc.write(root.pendingExpression + "\n")
            }
        }
    }

    function calculate(expression) {
        pendingExpression = expression
        debounceTimer.restart()
    }
}
