import QtQuick
import QtQuick.Controls
import qs.Widgets

FocusScope {
    id: root

    property var pluginService: null

    implicitHeight: settingsColumn.implicitHeight
    height: implicitHeight

    Column {
        id: settingsColumn
        anchors.fill: parent
        anchors.margins: 16
        spacing: 16

        Text {
            text: "Calculator Plugin Settings"
            font.pixelSize: 18
            font.weight: Font.Bold
            color: "#FFFFFF"
        }

        Text {
            text: "This plugin evaluates mathematical expressions and copies the result to your clipboard."
            font.pixelSize: 14
            color: "#CCFFFFFF"
            wrapMode: Text.WordWrap
            width: parent.width - 32
        }

        Rectangle {
            width: parent.width - 32
            height: 1
            color: "#30FFFFFF"
        }

        Column {
            spacing: 12
            width: parent.width - 32

            Text {
                text: "Trigger Configuration"
                font.pixelSize: 16
                font.weight: Font.Medium
                color: "#FFFFFF"
            }

            Text {
                text: noTriggerToggle.checked ? "Calculator is always active. Simply type a math expression like '3 + 3' in the launcher." : "Set a trigger prefix to activate the calculator. Type the trigger before your expression."
                font.pixelSize: 12
                color: "#CCFFFFFF"
                wrapMode: Text.WordWrap
                width: parent.width
            }

            Row {
                spacing: 12

                CheckBox {
                    id: noTriggerToggle
                    text: "No trigger (always active)"
                    checked: loadSettings("noTrigger", false)

                    contentItem: Text {
                        text: noTriggerToggle.text
                        font.pixelSize: 14
                        color: "#FFFFFF"
                        leftPadding: noTriggerToggle.indicator.width + 8
                        verticalAlignment: Text.AlignVCenter
                    }

                    indicator: Rectangle {
                        implicitWidth: 20
                        implicitHeight: 20
                        radius: 4
                        border.color: noTriggerToggle.checked ? "#4CAF50" : "#60FFFFFF"
                        border.width: 2
                        color: noTriggerToggle.checked ? "#4CAF50" : "transparent"

                        Rectangle {
                            width: 12
                            height: 12
                            anchors.centerIn: parent
                            radius: 2
                            color: "#FFFFFF"
                            visible: noTriggerToggle.checked
                        }
                    }

                    onCheckedChanged: {
                        saveSettings("noTrigger", checked)
                        if (checked) {
                            saveSettings("trigger", "")
                        } else {
                            const currentTrigger = triggerField.text || "="
                            saveSettings("trigger", currentTrigger)
                        }
                    }
                }
            }

            Row {
                spacing: 12
                anchors.left: parent.left
                anchors.right: parent.right
                visible: !noTriggerToggle.checked

                Text {
                    text: "Trigger:"
                    font.pixelSize: 14
                    color: "#FFFFFF"
                    anchors.verticalCenter: parent.verticalCenter
                }

                DankTextField {
                    id: triggerField
                    width: 100
                    height: 40
                    text: loadSettings("trigger", "=")
                    placeholderText: "="
                    backgroundColor: "#30FFFFFF"
                    textColor: "#FFFFFF"

                    onTextEdited: {
                        const newTrigger = text.trim()
                        saveSettings("trigger", newTrigger || "=")
                        saveSettings("noTrigger", newTrigger === "")
                    }
                }

                Text {
                    text: "Examples: =, calc, c"
                    font.pixelSize: 12
                    color: "#AAFFFFFF"
                    anchors.verticalCenter: parent.verticalCenter
                }
            }
        }

        Rectangle {
            width: parent.width - 32
            height: 1
            color: "#30FFFFFF"
        }

        Column {
            spacing: 12
            width: parent.width - 32

            Text {
                text: "Calculator Engine"
                font.pixelSize: 16
                font.weight: Font.Medium
                color: "#FFFFFF"
            }

            Text {
                text: "Choose between the built-in calculator or qalc for more advanced calculations."
                font.pixelSize: 12
                color: "#CCFFFFFF"
                wrapMode: Text.WordWrap
                width: parent.width
            }

            Row {
                spacing: 12

                CheckBox {
                    id: useQalcToggle
                    text: "Use qalc for evaluation (more precision and features)"
                    checked: loadSettings("useQalc", false)

                    contentItem: Text {
                        text: useQalcToggle.text
                        font.pixelSize: 14
                        color: "#FFFFFF"
                        leftPadding: useQalcToggle.indicator.width + 8
                        verticalAlignment: Text.AlignVCenter
                    }

                    indicator: Rectangle {
                        implicitWidth: 20
                        implicitHeight: 20
                        radius: 4
                        border.color: useQalcToggle.checked ? "#4CAF50" : "#60FFFFFF"
                        border.width: 2
                        color: useQalcToggle.checked ? "#4CAF50" : "transparent"

                        Rectangle {
                            width: 12
                            height: 12
                            anchors.centerIn: parent
                            radius: 2
                            color: "#FFFFFF"
                            visible: useQalcToggle.checked
                        }
                    }

                    onCheckedChanged: {
                        saveSettings("useQalc", checked)
                    }
                }
            }

            Text {
                text: "⚠ Warning: qalc must be installed and in your PATH. If qalc is unavailable, an error notification will be shown."
                font.pixelSize: 11
                color: "#FFAA00"
                wrapMode: Text.WordWrap
                width: parent.width
                visible: useQalcToggle.checked
            }

            Row {
                spacing: 12
                anchors.left: parent.left
                anchors.right: parent.right
                visible: useQalcToggle.checked

                Text {
                    text: "Debounce (ms):"
                    font.pixelSize: 14
                    color: "#FFFFFF"
                    anchors.verticalCenter: parent.verticalCenter
                }

                DankTextField {
                    id: debounceField
                    width: 100
                    height: 40
                    text: loadSettings("qalcDebounceMs", "100")
                    placeholderText: "100"
                    backgroundColor: "#30FFFFFF"
                    textColor: "#FFFFFF"

                    onTextEdited: {
                        const value = parseInt(text)
                        if (!isNaN(value) && value >= 0) {
                            saveSettings("qalcDebounceMs", value)
                        }
                    }
                }

                Text {
                    text: "Delay before executing qalc (useful for slow typing)"
                    font.pixelSize: 12
                    color: "#AAFFFFFF"
                    anchors.verticalCenter: parent.verticalCenter
                }
            }
        }

        Rectangle {
            width: parent.width - 32
            height: 1
            color: "#30FFFFFF"
        }

        Column {
            spacing: 8
            width: parent.width - 32

            Text {
                text: "Supported Operations:"
                font.pixelSize: 14
                font.weight: Font.Medium
                color: "#FFFFFF"
            }

            Column {
                spacing: 4
                leftPadding: 16

                Text {
                    text: "• Addition: 3 + 3"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }

                Text {
                    text: "• Subtraction: 10 - 5"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }

                Text {
                    text: "• Multiplication: 4 * 7"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }

                Text {
                    text: "• Division: 20 / 4"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }

                Text {
                    text: "• Exponentiation: 2 ^ 8"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }

                Text {
                    text: "• Modulo: 17 % 5"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }

                Text {
                    text: "• Parentheses: (5 + 3) * 2"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }

                Text {
                    text: "• Decimals: 3.14 * 2"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }

                Text {
                    text: "• Unit conversion (qalc only): 2m to inches"
                    font.pixelSize: 12
                    color: useQalcToggle.checked ? "#4CAF50" : "#666666"
                    visible: true
                }

                Text {
                    text: "• Advanced math (qalc only): sin(45), sqrt(16), log(100)"
                    font.pixelSize: 12
                    color: useQalcToggle.checked ? "#4CAF50" : "#666666"
                    visible: true
                }
            }
        }

        Rectangle {
            width: parent.width - 32
            height: 1
            color: "#30FFFFFF"
        }

        Column {
            spacing: 8
            width: parent.width - 32

            Text {
                text: "Usage:"
                font.pixelSize: 14
                font.weight: Font.Medium
                color: "#FFFFFF"
            }

            Column {
                spacing: 4
                leftPadding: 16
                bottomPadding: 24

                Text {
                    text: "1. Open Launcher (Ctrl+Space or click launcher button)"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }

                Text {
                    text: noTriggerToggle.checked ? "2. Type a mathematical expression (e.g., '3 + 3')" : "2. Type your trigger followed by the expression (e.g., '= 3 + 3')"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }

                Text {
                    text: "3. The result will appear as a launcher item"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }

                Text {
                    text: "4. Press Enter to copy the result to clipboard"
                    font.pixelSize: 12
                    color: "#CCFFFFFF"
                }
            }
        }
    }

    function saveSettings(key, value) {
        if (pluginService) {
            pluginService.savePluginData("calculator", key, value)
        }
    }

    function loadSettings(key, defaultValue) {
        if (pluginService) {
            return pluginService.loadPluginData("calculator", key, defaultValue)
        }
        return defaultValue
    }
}
