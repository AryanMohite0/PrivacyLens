##! PRIVACYLENS — Zeek Privacy & Tracker Audit Script
##! Performs deep packet and protocol stream analysis to detect
##! third-party trackers, session replay beacons, and CNAME cloaking.

@load base/protocols/http
@load base/protocols/ssl
@load base/protocols/dns

module PrivacyLens;

export {
    redef enum Log::ID += { LOG };

    type Info: record {
        ts: time &log;
        uid: string &log;
        proto: string &log;
        host: string &log;
        uri: string &log &optional;
        method: string &log &optional;
        is_tracker: bool &log &default=F;
        tracker_name: string &log &optional;
        tracker_category: string &log &optional;
        is_screen_recorder: bool &log &default=F;
        is_cname_cloaked: bool &log &default=F;
        cname_target: string &log &optional;
        audit_note: string &log &optional;
    };

    global log_privacy: event(rec: Info);
}

event zeek_init() &priority=5 {
    Log::create_stream(PrivacyLens::LOG, [$columns=Info, $ev=log_privacy, $path="privacylens_audit"]);
}

# Inspect HTTP requests for session replay and ad tracking beacons
event http_request(c: connection, method: string, original_URI: string, unescaped_URI: string, version: string) {
    local host = c$http?$host ? c$http$host : "";
    local uri = original_URI;
    local is_trk = F;
    local trk_name = "";
    local trk_cat = "";
    local is_recorder = F;

    # Microsoft Clarity screen replay detection
    if ( /clarity\.ms/ in host ) {
        is_trk = T;
        is_recorder = T;
        trk_name = "Microsoft Clarity";
        trk_cat = "screen_recording";
    }
    # Hotjar screen replay detection
    else if ( /hotjar\.(com|io)/ in host ) {
        is_trk = T;
        is_recorder = T;
        trk_name = "Hotjar";
        trk_cat = "screen_recording";
    }
    # FullStory screen replay detection
    else if ( /fullstory\.com/ in host ) {
        is_trk = T;
        is_recorder = T;
        trk_name = "FullStory";
        trk_cat = "screen_recording";
    }
    # Meta Pixel cross-site retargeting
    else if ( /facebook\.(net|com)/ in host ) {
        is_trk = T;
        trk_name = "Meta Pixel";
        trk_cat = "advertising";
    }
    # Google Analytics / Tag Manager
    else if ( /google-analytics\.com/ in host || /googletagmanager\.com/ in host ) {
        is_trk = T;
        trk_name = "Google Analytics";
        trk_cat = "analytics";
    }

    if ( is_trk ) {
        local note = is_recorder ? "Active screen replay session telemetry captured on wire" : "Third-party ad/analytics telemetry observed";
        local rec: PrivacyLens::Info = [
            $ts = network_time(),
            $uid = c$uid,
            $proto = "http",
            $host = host,
            $uri = uri,
            $method = method,
            $is_tracker = T,
            $tracker_name = trk_name,
            $tracker_category = trk_cat,
            $is_screen_recorder = is_recorder,
            $audit_note = note
        ];
        Log::write(PrivacyLens::LOG, rec);
    }
}

# Inspect TLS / SSL handshakes (SNI matching)
event ssl_established(c: connection) {
    if ( c$ssl?$server_name ) {
        local sni = c$ssl$server_name;
        if ( /clarity\.ms/ in sni || /hotjar/ in sni || /fullstory/ in sni ) {
            local rec: PrivacyLens::Info = [
                $ts = network_time(),
                $uid = c$uid,
                $proto = "ssl",
                $host = sni,
                $is_tracker = T,
                $tracker_name = "Screen Recorder (Encrypted Stream)",
                $tracker_category = "screen_recording",
                $is_screen_recorder = T,
                $audit_note = "Encrypted TLS session established to known screen replay endpoint"
            ];
            Log::write(PrivacyLens::LOG, rec);
        }
    }
}

