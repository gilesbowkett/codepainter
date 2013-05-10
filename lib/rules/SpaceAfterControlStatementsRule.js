var assert = require('assert'),
    controlKeywords = [ 'if', 'for', 'switch', 'while' ];

SpaceAfterControlStatementsRule = {};

SpaceAfterControlStatementsRule.name = 'space_after_control_statements';

function isKeyword(token) {
    return token && token.type === 'Keyword' && controlKeywords.indexOf(token) !== -1;
}

SpaceAfterControlStatementsRule.infer = function (sample, callback) {
    var previousToken = null,
        spaces = {};

    sample.on('data', function (token) {
        if (isKeyword(previousToken)) {
            var keyword = previousToken.value;
            if (typeof spaces[keyword] === 'undefined')
                spaces[keyword] = { present: 0, omitted: 0, count: 0 };
            if (token.type === 'Whitespaces') {
                if (token.value === ' ')
                    spaces[keyword].present++;
            } else {
                assert(token.type === 'Punctuator' && token.value === '(');
                spaces[keyword].omitted++;
            }
            spaces[keyword].count++;
        }
        previousToken = token;
    });
    sample.on('end', function () {
        var value = {};
        for (var keyword in spaces) {
            var keywordValue = spaces[keyword],
                max = Math.max(keywordValue.present, keywordValue.omitted,
                               keywordValue.count - keywordValue.present - keywordValue.omitted);

            if (max === keywordValue.present)
                value[keyword] = 'true';
            else if (max === keywordValue.omitted)
                value[keyword] = 'false';
            else
                value[keyword] = null;
        }
        callback(value);
    });
};

SpaceAfterControlStatementsRule.transform = function (input, value, output) {
    var previousToken = null,
        space = { type: 'Whitespaces', value: ' ' };

    function shouldHaveSpace(keyword) {
        if (typeof value === 'object')
            return value[keyword];
        return value;
    }

    input.on('data', function (token) {
        token.write = true;
        if (isKeyword(previousToken)) {
            if (token.type === 'Whitespaces') {
                if (shouldHaveSpace(previousToken.value) !== 'false')
                    output.write(space);
            } else {
                assert(token.type === 'Punctuator' && token.value === '(');
                if (shouldHaveSpace(previousToken.value) === 'true')
                    output.write(space);
                output.write(token);
            }
        } else {
            output.write(token);
        }
        previousToken = token;
    });
    input.on('end', function () {
        output.end();
    });
};

module.exports = SpaceAfterControlStatementsRule;
