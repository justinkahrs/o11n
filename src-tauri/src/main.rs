// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let _guard = sentry::init(("https://2ecd4e293398e0556056554ea6627544@o4509202782683136.ingest.us.sentry.io/4509212412280832", sentry::ClientOptions {
        release: sentry::release_name!(),
        // Capture user IPs and potentially sensitive headers when using HTTP server integrations
        // see https://docs.sentry.io/platforms/rust/data-management/data-collected for more info
        send_default_pii: true,
        ..Default::default()
    }));
    o11n_lib::run();
}
