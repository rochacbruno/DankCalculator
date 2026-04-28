pragma Singleton
import QtQuick
import Quickshell
import Quickshell.Io

Singleton {
    id: root
    property bool active: false
    property string numbatCommand: "numbat"
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

    onNumbatCommandChanged: {
        if (!active)
            return;
        if (numbatProc.running) {
            numbatProc.running = false
        }
        numbatProc.running = true
    }

    Process {
        id: numbatProc
        command: root.splitCommand(root.numbatCommand)
        running: root.active
        stdinEnabled: true

        stdout: SplitParser {
            onRead: (data) => {
                var clean = data.trim()
                if (clean.length > 0) {
                    root.lastResult = clean
                    root.resultReady(clean)
                }
            }
        }

        onRunningChanged: {
            if (!running && root.active) {
                root._failCount++
                if (root._failCount > 3) {
                    root.failed = true
                    return
                }
                retryTimer.interval = root._failCount * 1000
                retryTimer.restart()
            } else if (running) {
                root._failCount = 0
                root.failed = false
                if (root.pendingExpression) {
                    debounceTimer.restart()
                }
            }
        }
    }

    Timer {
        id: retryTimer
        repeat: false
        onTriggered: {
            if (root.active && !numbatProc.running)
                numbatProc.running = true
        }
    }

    property string pendingExpression: ""

    Timer {
        id: debounceTimer
        interval: 400
        onTriggered: {
            if (root.pendingExpression && numbatProc.running) {
                numbatProc.write(root.pendingExpression + "\n")
            }
        }
    }

    function calculate(expression) {
        pendingExpression = expression
        debounceTimer.restart()
    }
}
