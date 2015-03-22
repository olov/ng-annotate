"use strict";

module.exports = {

    init: function(_ctx) {
    },

    match: function(node) {
        // dashboardProvider.widget("name", {
        //   ...
        //   controller: function($scope) {},
        //   resolve: {f: function($scope) {}, ..}
        // })

        function matchResolve(props) {
            const resolveObject = matchProp("resolve", props);
            if (resolveObject && resolveObject.type === "ObjectExpression") {
                return resolveObject.properties.map(function(prop) {
                    return prop.value;
                });
            }
            return [];
        };

        function matchProp(name, props) {
            for (let i = 0; i < props.length; i++) {
                const prop = props[i];
                if ((prop.key.type === "Identifier" && prop.key.name === name) ||
                    (prop.key.type === "Literal" && prop.key.value === name)) {
                    return prop.value;
                }
            }
            return null;
        }

        function last(arr) {
            return arr[arr.length - 1];
        }

        const callee = node.callee;
        if (!callee) {
            return false;
        }

        const obj = callee.object;
        if (!obj) {
            return false;
        }

        // identifier or expression
        if (!(obj.$chained === 1 || (obj.type === "Identifier" && obj.name === "dashboardProvider"))) {
            return false;
        }

        node.$chained = 1;

        const method = callee.property; // identifier
        if (method.name !== "widget") {
            return false;
        }

        const args = node.arguments;
        if (args.length !== 2) {
            return false;
        }

        const configArg = last(args);
        if (configArg.type !== "ObjectExpression") {
            return false;
        }

        const props = configArg.properties;
        const res = [
            matchProp("controller", props)
        ];
        // {resolve: ..}
        res.push.apply(res, matchResolve(props));

        // edit: {controller: function(), resolve: {}}
        const edit = matchProp('edit', props);
        if (edit && edit.type === "ObjectExpression") {
            const editProps = edit.properties;
            res.push(matchProp('controller', editProps));
            res.push.apply(res, matchResolve(editProps));
        }

        const filteredRes = res.filter(Boolean);
        return (filteredRes.length === 0 ? false : filteredRes);
    }
};
