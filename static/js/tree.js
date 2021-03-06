var tree = {
    fileTree: undefined,
    // 递归获取当前节点展开中的最后一个节点
    getCurrentNodeLastNode: function (node) {
        var returnNode = node.children[node.children.length - 1];
        if (returnNode.open) {
            return tree.getCurrentNodeLastNode(returnNode);
        } else {
            return returnNode;
        }
    },
    // 按照树展现获取下一个节点
    getNextShowNode: function (node) {
        if (node.level !== 0) {
            if (node.getParentNode().getNextNode()) {
                return node.getParentNode().getNextNode();
            } else {
                return tree.getNextShowNode(node.getParentNode());
            }
        } else {
            return node.getNextNode();
        }
    },
    isBottomNode: function (node) {
        if (node.open) {
            return false;
        }

        if (node.getParentNode()) {
            if (node.getParentNode().isLastNode) {
                return tree.isBottomNode(node.getParentNode());
            } else {
                return false;
            }
        } else {
            if (node.isLastNode) {
                return true;
            } else {
                return false;
            }
        }
    },
    getTIdByPath: function (path) {
        var nodes = tree.fileTree.transformToArray(tree.fileTree.getNodes());
        for (var i = 0, ii = nodes.length; i < ii; i++) {
            if (nodes[i].path === path) {
                return nodes[i].tId;
            }
        }

        return undefined;
    },
    getOpenPaths: function () {
        var nodes = tree.fileTree.transformToArray(tree.fileTree.getNodes()),
                paths = [];
        for (var i = 0, ii = nodes.length; i < ii; i++) {
            if (nodes[i].open) {
                paths.push(nodes[i].path);
            }
        }

        return paths;
    },
    _isParents: function (tId, parentTId) {
        var node = tree.fileTree.getNodeByTId(tId);
        if (!node || !node.parentTId) {
            return false;
        } else {
            if (node.parentTId === parentTId) {
                return true;
            } else {
                return tree._isParents(node.parentTId, parentTId);
            }
        }
    },
    newFile: function () {
        $("#dirRMenu").hide();
        $("#dialogNewFilePrompt").dialog("open");
    },
    newDir: function () {
        $("#dirRMenu").hide();
        $("#dialogNewDirPrompt").dialog("open");
    },
    removeIt: function () {
        $("#dirRMenu").hide();
        $("#fileRMenu").hide();
        $("#dialogRemoveConfirm").dialog("open");
    },
    init: function () {
        var request = newWideRequest();

        $.ajax({
            type: 'POST',
            url: '/files',
            data: JSON.stringify(request),
            dataType: "json",
            success: function (data) {
                if (data.succ) {
                    var dirRMenu = $("#dirRMenu");
                    var fileRMenu = $("#fileRMenu");
                    var setting = {
                        view: {
                            selectedMulti: false
                        },
                        callback: {
                            onDblClick: function (event, treeId, treeNode) {
                                if (treeNode) {
                                    tree.openFile(treeNode);
                                }
                            },
                            onRightClick: function (event, treeId, treeNode) {
                                if (treeNode) {
                                    wide.curNode = treeNode;
                                    tree.fileTree.selectNode(treeNode);

                                    if ("ico-ztree-dir " !== treeNode.iconSkin) { // 如果右击了文件
                                        $("#fileRMenu ul").show();
                                        fileRMenu.css({
                                            "top": event.clientY - 10 + "px",
                                            "left": event.clientX + "px",
                                            "display": "block"
                                        });
                                    } else { // 右击了目录
                                        $("#dirRMenu ul").show();
                                        dirRMenu.css({
                                            "top": event.clientY - 10 + "px",
                                            "left": event.clientX + "px",
                                            "display": "block"
                                        });
                                    }
                                    $("#files").focus();
                                }
                            },
                            onClick: function (event, treeId, treeNode, clickFlag) {
                                if (treeNode) {
                                    wide.curNode = treeNode;
                                    tree.fileTree.selectNode(treeNode);
                                    $("#files").focus();
                                }
                            }
                        }
                    };
                    tree.fileTree = $.fn.zTree.init($("#files"), setting, data.root.children);

                    session.restore();
                }
            }
        });
    },
    openFile: function (treeNode) {
        wide.curNode = treeNode;

        for (var i = 0, ii = editors.data.length; i < ii; i++) {
            // 该节点文件已经打开
            if (editors.data[i].id === treeNode.tId) {
                editors.tabs.setCurrent(treeNode.tId);
                wide.curNode = treeNode;
                wide.curEditor = editors.data[i].editor;
                wide.curEditor.focus();
                return false;
            }
        }

        if ("ico-ztree-dir " !== treeNode.iconSkin) { // 如果单击了文件
            var request = newWideRequest();
            request.path = treeNode.path;

            $.ajax({
                async: false,
                type: 'POST',
                url: '/file',
                data: JSON.stringify(request),
                dataType: "json",
                success: function (data) {
                    if (!data.succ) {
                        $("#dialogAlert").dialog("open", data.msg);

                        return false;
                    }

                    if ("img" === data.mode) { // 是图片文件的话新建 tab 打开
                        // 最好是开 tab，但这个最终取决于浏览器设置
                        var w = window.open(data.path);
                        return false;
                    }

                    editors.newEditor(data);
                }
            });
        }
    }
};