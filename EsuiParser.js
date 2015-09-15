define(function (require, exports, module) {
    var EventExprParser = require('/dom-data-bind/dist/main').EventExprParser;
    var inherit = require('/dom-data-bind/dist/main').inherit;
    var Tree = require('/dom-data-bind/dist/main').Tree;
    var utils = require('/dom-data-bind/dist/main').utils;
    var esui = require('esui');
    var ViewContext = require('esui/ViewContext');

    function EsuiParser(options) {
        EventExprParser.call(this, options);
    }

    EsuiParser.prototype.collectExprs = function () {
        if (this.node.nodeType === 1 && /^esui/.test(this.node.nodeName.toLowerCase())) {
            var viewContext = this.tree.getTreeVar('viewContext');
            if (!viewContext) {
                viewContext = new ViewContext('EsuiParser-' + new Date().getTime());
                this.tree.setTreeVar('viewContext', viewContext);
            }

            this.control = esui.create(getControlType(this.node), {
                viewContext: viewContext,
                main: this.node
            });
            this.control.render();
        }

        EventExprParser.prototype.collectExprs.apply(this);
    };

    EsuiParser.prototype.addExpr = function (attr) {
        if (this.node.nodeType === 1 && /^esui/.test(this.node.nodeName.toLowerCase())) {
            if (!this.config.getExprRegExp().test(attr.value)) {
                this.control.set(attr.name, attr.value);
                return;
            }

            var expr;

            // 是事件
            if (attr.name.indexOf('event-') === 0) {
                expr = attr.value.replace(
                    this.config.getExprRegExp(),
                    function () {
                        return arguments[1];
                    }
                );
                this.exprCalculater.createExprFn(expr, true);

                var me = this;
                var eventName = attr.name.replace('event-', '');
                this.control.on(eventName, function (event) {
                    me.exprCalculater.calculate(expr, true, utils.extend({}, me.curData, {event: event}));
                });
                return;
            }

            expr = attr.value;
            this.exprs.push(expr);
            if (!this.exprFns[expr]) {
                this.exprFns[expr] = createExprFn(this, expr);
            }
            this.updateFns[expr] = this.updateFns[expr] || [];
            this.updateFns[expr].push((function (me, attrName) {
                return function (exprValue) {
                    me.control.set(attrName, exprValue);
                };
            })(this, attr.name));
        }
        else {
            EventExprParser.prototype.addExpr.apply(this, arguments);
        }
    };

    module.exports = inherit(EsuiParser, EventExprParser);
    Tree.registeParser(EsuiParser);

    function getControlType(node) {
        var nodeName = node.nodeName.toLowerCase().replace(/^esui/, '');
        return nodeName.slice(0, 1).toUpperCase() + nodeName.slice(1);
    }

    function createExprFn(parser, expr) {
        return function (data) {
            return expr.replace(parser.config.getExprRegExp(), function () {
                parser.exprCalculater.createExprFn(arguments[1]);
                return parser.exprCalculater.calculate(arguments[1], false, data);
            });
        };
    }
});
