import socket
import ipaddress
import urllib.request
import urllib.parse
import json

def googleformat_verify(domain_name):
    domain_name = domain_name.rstrip('.')
    
    if not(1 <= len(domain_name) <= 253):
        print('[Debug] Length of Domain name is:', len(domain_name))
        raise Exception('DomainNameTooLong')
    
    for label in domain_name.split('.'):
        if not(1 <= len(label) <= 63):
            print('[Debug] Length of', label, 'is:', len(label))
            raise Exception('LabelTooLong')
    try:
        return domain_name.encode('ascii')
    except UnicodeEncodeError:
        print('[Debug]', domain_name, 'contain escaped or non-ASCII characters')
        raise Exception('DomainNameCharacterError')

def doh_google(domain_name):
    public_ip = urllib.request.urlopen('https://api.ipify.org').read().decode('utf-8')
    print('[Debug] Your public IP is:', public_ip)
    edns_client_subnet = public_ip + '/24'

    ip_addr_os = socket.gethostbyname(domain_name)
    print('[debug] IP address of [', domain_name.decode('utf-8'), '] in OS is ', ip_addr_os, sep='')
    
    if ipaddress.ip_address(ip_addr_os).is_global:
        google_params = {
            'name': domain_name,
            'type': '1',
            'cd': bool(False),
            'edns_client_subnet': edns_client_subnet,
            'random_padding': ''
            }
        params = urllib.parse.urlencode(google_params)
        url = 'https://dns.google.com/resolve?%s' %params
        print('[Debug] You are going to:', url)
        answers = []
    
        r = urllib.request.urlopen(url)
        if r.getcode() == 200:
            rjson = json.loads(r.read().decode('utf-8'))
            print('[Debug] Respone is:', rjson)
            print('[Debug] Status of DoH is:', rjson['Status'])
            if rjson['Status'] == 0:
                for ans in rjson['Answer']:
                 response_type, data = map(ans.get, ('type', 'data'))
                 if response_type == 1:
                     answers.append(data)
                return answers
            else:
                print('Status code is:', rjson['Status'])
                return
        else:
            print('HTTP code is:', r.getcode())
            return
    else:
        answers = ip_addr_os
        return answers

print('IP is:', doh_google(googleformat_verify('www.google.com.')))