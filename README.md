# ui-mention
Facebook-like @mentions for text inputs built around composability

## Contribute

0. `npm install`
0. `npm install -g gulp bower`
0. `bower install`
0. `gulp [watch]`
0. Compiling the example code: `gulp example [watch]`

## Amazing Features!

Find things!:
```
mention.findChoices = function(match) {
  // Matches items from search query
  return [/* choices */].filter( choice => ~this.label(choice).indexOf(match[1]) );
}
```

Type too damn fast? Throttle that bitch:
```
mention.findChoices = _.throttle(function(match) {
  return [/* choices */];
}, 300);
```

Hate redundancy? De-dupe that shiz:
```
mention.findChoices = function(match, mentions) {
  return [ /* choices */ ].filter( choice => !mentions.some( mention => mention.id === choice.id ) )
};
```

Use the awesome power of the internet:
```
mention.findChoices = function(match) {
  return $http.get('/users', { params: { q: match[1] } })
    .then( response => response.data );
}
```

Your servers are slow? Bitch please.
```
mention.findChoices = function(match) {
  mention.loading = true;
  return $http.get(...)
    .then( response => {
      mention.loading = false;
      return response.data;
    });
}
```

Dropdown that list like it's hot:
```
<ul ng-if="$mention.choices.length" class="dropdown">
  <li ng-repeat="choice in choice" ng-click="$mention.select(choice)">
    {{::choice.name}}
  </li>
</ul>
```

SPINNIES!
```
<ul ng-if="$mention.choices.length" class="dropdown">
  <li ng-show="$mention.loading">Hacking the gibson...</li>
  <li ng-repeat=...>...</li>
</ul>
```
