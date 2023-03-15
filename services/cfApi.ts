import axios from "axios";

export function deleteRecord(cfKey, zoneId, recordId, next){
    let url = "https://api.cloudflare.com/client/v4/zones/" + zoneId + "/dns_records/" + recordId;
    axios.delete(
        url,
        {
        headers: {
            "Authorization": "Bearer " + cfKey,
            "Content-Type": "application/json"
        }
        }
    ).then(res => {
        return next(null, res);
    }).catch(err => {
        return next(err, null);
    })
}

export function addRecord(cfKey, zoneId, ipAdd, subDomain, next){
    let url = "https://api.cloudflare.com/client/v4/zones/" + zoneId + "/dns_records";
    axios.post(
      url,
      {
        type: "A",
        content: ipAdd,
        name: subDomain,
        ttl: 1
      },
      {
        headers: {
          "Authorization": "Bearer " + cfKey,
          "Content-Type": "application/json"
        }
      }
    ).then((res) => {
        return next(null, res)
    }).catch((err) => {
        return next(err, null)
    })
}

export function getAllRecords(cfKey, zoneId, subDomain, next){
    axios.get(
        "https://api.cloudflare.com/client/v4/zones/" + zoneId + "/dns_records?name=" + subDomain,
        {
          headers: {
            "Authorization": "Bearer " + cfKey,
            "Content-Type": "application/json"
          }
        }
    ).then(res => {
        return next(null, res);
    }).catch(err => {
        return next(err, null);
    })
}

export function verifyToken(cfKey, next) {
    axios.get(
        `https://api.cloudflare.com/client/v4/user/tokens/verify`,
        {
          headers: {
            "Authorization": "Bearer " + cfKey,
            "Content-Type": "application/json"
          }
        }
      ).then(res => {
        return next(null, res)
      }).catch(err => {
        return next(err, null);
      })
}

export function verifyZone(cfKey, domain, next) {
    axios.get(
        "https://api.cloudflare.com/client/v4/zones?name=" + domain ,
        {
          headers: {
            "Authorization": "Bearer " + cfKey,
            "Content-Type": "application/json"
          }
        }
      ).then(res => {
        return next(null, res)
      }).catch(err => {
        return next(err, null)
      })
}
