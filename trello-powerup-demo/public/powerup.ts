const t = (window as any).TrelloPowerUp;

t.initialize({

    "board-buttons": function () {

        return [{

            text: "Hello",

            callback: function (t:any) {

                return t.popup({

                    title: "My First Power-Up",

                    url: "/"

                });

            }

        }];

    }

});