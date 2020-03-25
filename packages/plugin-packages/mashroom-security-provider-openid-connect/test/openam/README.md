
# Setup OpenAM

 1. Start docker compose

         docker-compose up

 2. Open: http://localhost:8080/openam
 3. Create a configuration
 4. Login with amAdmin/<admin password selected in step 3>
 5. Create a new realm
 6. In the Dashboard select Configure OAuth provider -> Configure OpenID Connect -> Create
 7. In the Dashboard select Applications -> OAuth 2.0 from the menu and create a new Agent
 8. Click on the new agent:
    * Add the redirection URI (e.g. http://localhost:5050/openid-connect-cb)
    * Add the scopes: openid email profile
    * Set the ID Token Signing Algorithm to RS256
 9. In the Realm Dashboard go to Scripts -> New Script -> Create a script with type OIDC_CLAIMS
    * Add _import com.sun.identity.idm.IdType_
    * Add the following to the _claimAttributes_:
        ```
    	    "roles": { claim, identity, requested -> identity.getMemberships(IdType.GROUP).collect { group -> group.name } }
        ```
    * Add "roles" to the scopeClaimMap "profile" entry
 10. From the OpenAM Toolbar select Configure -> Global Services -> Scripting -> Secondary Configurations -> OIDC_CLAIMS ->
     Secondary Configuration -> EngineConfiguration and add _com.sun.identity.idm.IdType_ to the class whitelist
 11. In the Realm Dashboard select Services -> OAuth2 Provider
     * Activate "Use Stateless Access & Refresh Tokens"
     * Activate "Issue Refresh Tokens"
     * Decrease the "Access Token Lifetime" to 300 seconds
     * In "OIDC Claims Script" select the script crated in step 9
 12. Create a few Subjects (Users)
 13. Create a group "mashroom-admin" and assign a user to it, it will get admin rights
