vcl 4.0;

backend default {
  .host = "host.docker.internal:5050";
}

sub vcl_deliver {
  if (req.url ~ "/webfonts/") {
    set resp.http.Access-Control-Allow-Origin = "*";
    set resp.http.Access-Control-Allow-Methods = "GET, OPTIONS";
    set resp.http.Access-Control-Allow-Headers = "Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token";
  }
}
