const queryTokensSet = new Set(queryTokens);
queryTokensSet.add('куртка');
queryTokensSet.add('jackets');
queryTokensSet.delete([...queryTokensSet][0]);

queryTokens.shift();

console.log('queryTokens:');
queryTokens.forEach(token => {
    console.log("queryTokensBefore:", token);
});


queryTokens = new Set([...queryTokens].filter(token => token !== word));

console.log('queryTokens:');
queryTokens.forEach(token => {
    console.log("queryTokens:", token);
});