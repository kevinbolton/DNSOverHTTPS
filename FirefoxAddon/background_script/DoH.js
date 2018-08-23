function resolved(record) {
    console.log("Resolved by OS' DNS...");
    console.log(record.canonicalName);
    console.log(record.addresses);
}

function resolved_trr(record_trr) {
    console.log("Resolved by trr...");
    console.log(record_trr.canonicalName);
    console.log(record_trr.addresses);
}

domain_name = "tw.yahoo.com";

let resolving = browser.dns.resolve(domain_name, ["disable_trr", "bypass_cache", "canonical_name"]);
resolving.then(resolved);

let resolving_trr = browser.dns.resolve(domain_name, ["bypass_cache", "canonical_name"]);
resolving_trr.then(resolved_trr);