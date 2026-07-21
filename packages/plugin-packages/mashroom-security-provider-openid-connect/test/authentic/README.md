
# Setup Authentic

1. Start docker compose

        docker-compose up

2. Open: http://localhost:9000
3. Create the default admin login
4. In the Admin Interface goto Directory -> Users
  * Add some internal users
  * Set passwords for them
5. Goto Directory -> Groups
  * Add new group mashroom-admin
  * Add the admin user to the group
6. Create a new application
  * Application Name: mashroom
  * Next -> Select Oauth2/OpenID Provider
  * Next -> Authorization Flow: provider-authorization-explicit-consent
  * Client Type: Confidential
  * Redirect URI: Add http://localhost:5050/openid-connect-cb
  * Next -> Create Application
  * In the User Bindings tab add the users created above


