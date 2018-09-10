// consider to remove resultByPtr

// Web site IP, PTR, FQDN, Domain name from webRequest
var webIpFromBrowser, webPtrFromBrowser, webFqdnFromBrowser, webDomainFromBrowser;
var dohClient, dohClientReverse, dohClientIP;
// [3 ~ 5] Web site IP from DNS over HTTPS server, [dohed:false...dohed:true]
var webIpForDoh, webPtrForDoh, webCnameForDoh;
// Resluts
var flagPrivateIp, resultByIp, resultByPtr, resultByCname;
var currentTab, resultOfDohs;

function changeIcon() {
    console.log("Is private IP?", flagPrivateIp.toString()); // For Debug
    console.log("Result by IP:", resultByIp); // For Debug
    console.log("Result by PTR:", resultByPtr); // For Debug
    console.log("Result by CNAME:", resultByCname); // For Debug

    if (flagPrivateIp) {
        browser.browserAction.setIcon({
            path: {
                16: "icons/YellowButton-16.png",
                32: "icons/YellowButton-32.png"
            },
            tabId: currentTab.id
        });
    } else if (resultByIp == "Red" && resultByPtr == "Red" && resultByCname == "Red") {
        browser.browserAction.setIcon({
            path: {
                16: "icons/RedButton-16.png",
                32: "icons/RedButton-32.png"
            },
            tabId: currentTab.id
        });
    } else {
        browser.browserAction.setIcon({
            path: {
                16: "icons/GreenButton-16.png",
                32: "icons/GreenButton-32.png"
            },
            tabId: currentTab.id
        });
    }
}

function getResult() {
    console.log("IP from Browser:", webIpFromBrowser);
    console.log("PTR from Browser:", webPtrFromBrowser);
    console.log("Fqdn from Browser:", webFqdnFromBrowser);
    console.log("Domain name from Browser:", webDomainFromBrowser);
    console.log("IPs from DoH", webIpForDoh);
    console.log("PTRs from DoH", webPtrForDoh);
    console.log("CNAMEs from DoH", webCnameForDoh);

    for (let i in webIpForDoh) {
        if (resultByIp == "Green") {
            break;
        } else {
            if (webIpForDoh[i].answer == true && webIpForDoh[i].ip == webIpFromBrowser) {
                resultByIp = "Green";
                break;
            } else {
                resultByIp = "Red";
            }
        }
    }

    // Green if PTR/CNAME contain domain name 
    for (let i in webPtrForDoh) {
        if (resultByPtr == "Green") {
            break;
        } else {
            if (webPtrForDoh[i].answer == true && webPtrForDoh[i].ptr.search(webDomainFromBrowser) != -1) {
                resultByPtr = "Green";
                break;
            } else {
                resultByPtr = "Red";
            }
        }
    }

    for (let i in webCnameForDoh) {
        if (resultByCname == "Green") {
            break;
        } else {
            if (webCnameForDoh[i].answer == true && webCnameForDoh[i].cname.search(webDomainFromBrowser) != -1) {
                resultByCname = "Green";
                break;
            } else {
                resultByCname = "Red";
            }
        }
    }
}

function updateRecordDoh() { 
    if(dohClient.status == 200 && dohClient.response != null) {
        if (dohClient.response.Status == 0) {
            for (x in dohClient.response.Answer) {
                switch(dohClient.response.Answer[x].type) {
                    case 1:
                        let locationOfwebCnameForDohN1 = webCnameForDoh.map(function(e) { return e.cname; }).indexOf(dohClient.response.Answer[x].name);
                        if (locationOfwebCnameForDohN1 == -1) {
                            webCnameForDoh.push({cname: dohClient.response.Answer[x].name, dohed: true, answer: false});
                        } else {
                            webCnameForDoh[locationOfwebCnameForDohN1].dohed = true;
                        }

                        let locationOfwebIpForDoh = webIpForDoh.map(function(e) { return e.ip; }).indexOf(dohClient.response.Answer[x].data);
                        if (locationOfwebIpForDoh == -1)
                            webIpForDoh.unshift({ip: dohClient.response.Answer[x].data, dohed: false, answer: true});
                        break;
                    case 5:
                        let locationOfwebCnameForDohN5 = webCnameForDoh.map(function(e) { return e.cname; }).indexOf(dohClient.response.Answer[x].name);
                        if (locationOfwebCnameForDohN5 == -1) {
                            webCnameForDoh.push({cname: dohClient.response.Answer[x].name, dohed: true, answer: false});
                        } else {
                            webCnameForDoh[locationOfwebCnameForDohN5].dohed = true;
                        }

                        let locationOfwebCnameForDohD = webCnameForDoh.map(function(e) { return e.cname; }).indexOf(dohClient.response.Answer[x].data);
                        if (locationOfwebCnameForDohD == -1)
                            webCnameForDoh.unshift({cname: dohClient.response.Answer[x].data, dohed: false, answer: true});
                        break;
                    default:
                        console.log("[Error] DoH answer is: ", dohClient.response.Answer[x]);
                }
            }
        } else {
            console.log("[Error] DoH response status: ", dohClient.response.Status);
        }
    } else {
        console.log("[Error] DoH status: ", dohClient.status);
        console.log("[Error] DoH Response: ", dohClient.response);
    }
}

function updateRecordDohReverse() { 
    if(dohClientReverse.status == 200 && dohClientReverse.response != null) {
        if (dohClientReverse.response.Status == 0) {
            for (x in dohClientReverse.response.Answer) {
                switch(dohClientReverse.response.Answer[x].type) {
                    case 12:
                        let locationOfwebPtrForDoh = webPtrForDoh.map(function(e) { return e.ptr; }).indexOf(dohClientReverse.response.Answer[x].name);
                        if (locationOfwebPtrForDoh == -1) {
                            webPtrForDoh.push({ptr: dohClientReverse.response.Answer[x].name, dohed: true, answer: false});
                        } else {
                            webPtrForDoh[locationOfwebPtrForDoh].dohed = true;
                        }

                        let locationOfwebCnameForDoh = webCnameForDoh.map(function(e) { return e.cname; }).indexOf(dohClientReverse.response.Answer[x].data);
                        if (locationOfwebCnameForDoh == -1)
                            webCnameForDoh.unshift({cname: dohClientReverse.response.Answer[x].data, dohed: false, answer: true});
                        break;
                    default:
                        console.log("[Error] Reverse DoH answer is: ", dohClientReverse.response.Answer[x]);
                }
            }
        } else {
            console.log("[Error] Reverse DoH response status: ", dohClientReverse.response.Status);
        }
    } else {
        console.log("[Error] Reverse DoH status: ", dohClientReverse.status);
        console.log("[Error] Reverse DoH Response: ", dohClientReverse.response);
    }
}

function updateRecordDohIp() { 
    if(dohClientIp.status == 200 && dohClientIp.response != null) {
        if (dohClientIp.response.Status == 0) {
            for (x in dohClientIp.response.Answer) {
                switch(dohClientIp.response.Answer[x].type) {
                    case 12:
                        let locationOfwebPtrForDoh = webPtrForDoh.map(function(e) { return e.ptr; }).indexOf(dohClientIp.response.Answer[x].name);
                        if (locationOfwebPtrForDoh == -1) {
                            webPtrForDoh.push({ptr: dohClientIp.response.Answer[x].name, dohed: true, answer: false});
                        } else {
                            webPtrForDoh[locationOfwebPtrForDoh].dohed = true;
                        }

                        let locationOfwebCnameForDoh = webCnameForDoh.map(function(e) { return e.cname; }).indexOf(dohClientIp.response.Answer[x].data);
                        if (locationOfwebCnameForDoh == -1)
                            webCnameForDoh.unshift({cname: dohClientIp.response.Answer[x].data, dohed: false, answer: true});
                        
                        let ptrToIp = dohClientIp.response.Answer[x].name;
                        ptrToIp = ptrToIp.split(".");
                        ptrToIp = ptrToIp[3] + "." + ptrToIp[2] + "." + ptrToIp[1] + "." + ptrToIp[0];
                        let locationOfwebIpForDoh = webIpForDoh.map(function(e) { return e.ip; }).indexOf(ptrToIp);
                        if (locationOfwebIpForDoh == -1) {
                            webIpForDoh.push({ip: ptrToIp, dohed: true, answer: false});
                        } else {
                            webIpForDoh[locationOfwebIpForDoh].dohed = true;
                        }
                        break;    
                    default:
                        console.log("[Error] IP DoH answer is: ", dohClientIp.response.Answer[x]);
                }
            }
        } else {
            console.log("[Error] IP DoH response status: ", dohClientIp.response.Status);
        }
    } else {
        console.log("[Error] IP DoH status: ", dohClientIp.status);
        console.log("[Error] IP DoH Response: ", dohClientIp.response);
    }
}

function waitForAllDohDone() {
    switch (resultOfDohs) {
        case 7:
            if (dohClient.readyState == XMLHttpRequest.DONE && dohClientReverse.readyState == XMLHttpRequest.DONE && dohClientIp.readyState == XMLHttpRequest.DONE) {
                updateRecordDoh();
                updateRecordDohReverse();
                updateRecordDohIp();
                dohFromWebInfo();
            }
            break;

        case 6:
            if (dohClient.readyState == XMLHttpRequest.DONE && dohClientReverse.readyState == XMLHttpRequest.DONE) {
                updateRecordDoh();
                updateRecordDohReverse();
                dohFromWebInfo();
            }
            break;

        case 5:
            if (dohClient.readyState == XMLHttpRequest.DONE && dohClientIp.readyState == XMLHttpRequest.DONE) {
                updateRecordDoh();
                updateRecordDohIp();
                dohFromWebInfo();
            }
            break;
    
        case 4:
            if (dohClient.readyState == XMLHttpRequest.DONE) {
                updateRecordDoh();
                dohFromWebInfo();
            }
            break;

        case 3:
            if (dohClientReverse.readyState == XMLHttpRequest.DONE && dohClientIp.readyState == XMLHttpRequest.DONE) {
                updateRecordDohReverse();
                updateRecordDohIp();
                dohFromWebInfo();
            }
            break;

        case 2:
            if (dohClientReverse.readyState == XMLHttpRequest.DONE) {
                updateRecordDohReverse();
                dohFromWebInfo();
            }
            break;

        case 1:
            if (dohClientIp.readyState == XMLHttpRequest.DONE) {
                updateRecordDohIp();
                dohFromWebInfo();
            }
            break;
    }
}

function dohFromWebInfo() {
    resultOfDohs = 0; // [cname][ptr][ip]
    for (i in webCnameForDoh) {
        if (webCnameForDoh[i].dohed == false) {
            let urlForDoH = "https://dns.google.com/resolve?name=" + webCnameForDoh[i].cname;
            dohClient = new XMLHttpRequest();
            dohClient.open("GET", urlForDoH, true);
            dohClient.responseType = "json";
            dohClient.onreadystatechange = waitForAllDohDone;
            dohClient.send();
            resultOfDohs += 4;
            break;
        }
    }

    for (i in webPtrForDoh) {
        if (webPtrForDoh[i].dohed == false) {
            let urlForReverseDoh = "https://dns.google.com/resolve?name=" + webPtrForDoh[i].ptr +"&type=PTR";
            dohClientReverse = new XMLHttpRequest();
            dohClientReverse.open("GET", urlForReverseDoh, true);
            dohClientReverse.responseType = "json";
            dohClientReverse.onload = waitForAllDohDone;
            dohClientReverse.send();
            resultOfDohs += 2;
            break;
        }
    }

    for (i in webIpForDoh) {
        if (webIpForDoh[i].dohed == false) {
            let ptrformWebIpFromDoh = getPtr(webIpForDoh[i].ip);
            let urlForIpDoh = "https://dns.google.com/resolve?name=" + ptrformWebIpFromDoh +"&type=PTR";
            dohClientIp = new XMLHttpRequest();
            dohClientIp.open("GET", urlForIpDoh, true);
            dohClientIp.responseType = "json";
            dohClientIp.onload = waitForAllDohDone;
            dohClientIp.send();
            resultOfDohs += 1;
            break;
        }
    }

    if (resultOfDohs == 0) {
        getResult();
        changeIcon();
    }
}

function isPrivateIp(webIp) {
    let ip = webIp.split(".");
    if (ip[0] == 10) {
        return true;
    } else if (ip[0] == 172 && ip[1] >= 16 && ip[1] <= 32) {
        return true;
    } else if (ip[0] == 192 && ip[1] == 168) {
        return true;
    } else {
        return false;
    }
}

function getDomain(fqdn) {
    let domain;
    let webDomain = "";
    domain = fqdn.split('.');
    for (i = 1; i < domain.length; i++) {
        if ((i+1) < domain.length) {
            webDomain = webDomain + domain[i] + ".";
        } else {
            webDomain = webDomain + domain[i];
        }
    }
    return webDomain;
}

function getFqdn(url) {
    let fqdn;

    if (url.indexOf("//") > -1) {
        fqdn = url.split('/')[2];
    } else {
        fqdn = url.split('/')[0];
    }

    fqdn = fqdn.split(':')[0]; //find & remove port number
    fqdn = fqdn.split('?')[0]; //find & remove "?"
    fqdn += ".";

    return fqdn;
}

function getPtr(webIp) {
    let ptr = webIp.split(".");
    return ptr[3] + "." + ptr[2] + "." + ptr[1] + "." + ptr[0] + ".in-addr.arpa.";
}

function getWebInfoFromBrowser(browserResponse) {
    webIpFromBrowser = browserResponse.ip;
    webPtrFromBrowser = getPtr(webIpFromBrowser);
    webFqdnFromBrowser = getFqdn(browserResponse.url);
    webDomainFromBrowser = getDomain(webFqdnFromBrowser);
    flagPrivateIp = isPrivateIp(webIpFromBrowser);
    webIpForDoh.push({ip: webIpFromBrowser, dohed: true, answer: false});
    webPtrForDoh.unshift({ptr: webPtrFromBrowser, dohed: false, answer: false});
    webCnameForDoh.unshift({cname: webFqdnFromBrowser, dohed: false, answer: false});
}

function doh(browserResponse) {
    webIpForDoh = [];
    webPtrForDoh = [];
    webCnameForDoh = [];
    resultByIp = "";
    resultByPtr = "";
    resultByCname = "";
    getWebInfoFromBrowser(browserResponse);
    dohFromWebInfo();
}
browser.webRequest.onResponseStarted.addListener(doh, {urls:["*://*/*"], types:["main_frame"]}, ["responseHeaders"]);

function updateActiveTab() {
    function updateTab(tabs) {
        if (tabs[0])
            currentTab = tabs[0];
    }

    var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
    gettingActiveTab.then(updateTab);
}
browser.tabs.onUpdated.addListener(updateActiveTab); // listen to tab URL changes
browser.tabs.onActivated.addListener(updateActiveTab); // listen to tab switching
browser.windows.onFocusChanged.addListener(updateActiveTab); // listen for window switching
updateActiveTab(); // update when the extension loads initially