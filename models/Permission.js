define(['altair/facades/declare',
        'lodash'],

    function (declare,
              _) {

        "use strict";

        return declare(null, {

            //map of permissions to role levels
            CAN_CLAIM_MESSAGES: 10,
            CAN_SET_ROLE:       1000,

            canSetRole: function (user) {
                return this.can(this.CAN_SET_ROLE, user);
            },

            canClaimMessages: function (user) {
                return this.can(this.CAN_CLAIM_MESSAGES, user);
            },

            canViewOtherUsersMessages: function (user) {
                return this.canClaimMessages(user);
            },

            can: function (perm, user) {

                var role = user && user.get('role') || 0;

                return role >= perm;


            }


        });

    });