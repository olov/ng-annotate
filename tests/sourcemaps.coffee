### before ###

myMod.controller "ctrl1", (ctrl1_param1, ctrl1_param2) ->
    ### ctrl1 body ###

myMod.controller "ctrl2", ["remove", "me", (ctrl2_param1, ctrl2_param2) ->
    ### ctrl2 body ###
]

myMod.controller "ctrl3", [
    "remove",
    "me",
    (ctrl3_param1, ctrl3_param2) ->
        ### ctrl3 body ###
]

### @ngInject ###
ctrl4 = (ctrl4_param1, ctrl4_param2) ->
    ### ctrl4 body ###

### after ###