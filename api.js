var request = require("request");
var DOMParser = require("xmldom").DOMParser;
const crypto = require('crypto');

var private_key = '';

const fs = require('fs');

fs.readFile('uat_my_store.key', (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  private_key = data;
});

var public_key = '';
const fs1 = require('fs');
fs1.readFile('uat_my_key_store.crt', (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  public_key = data;
});

function dateToLocalISO(date) {
    const off    = date.getTimezoneOffset()
    const absoff = Math.abs(off)
    return (new Date(date.getTime() - off*60*1000).toISOString().substr(0,23) +
            (off > 0 ? '-' : '+') + 
            (absoff / 60).toFixed(0).padStart(2,'0') + ':' + 
            (absoff % 60).toString().padStart(2,'0'))
}


const query = (Temp, elementToParse) => {
	
	  const signer = crypto.createSign('RSA-SHA256');
	  // Test it:
	d = new Date();
      var myTimeStamp = dateToLocalISO(d);
	

	  //console.log("test-->",myTimeStamp);     
      console.log('testing timestamp');
      console.log('timeStamp in request :: ', myTimeStamp);
	  console.log('myprivatekey: ',private_key);
      signer.write(myTimeStamp);
      signer.end();
	  
	  //console.log( (new Date()).toString());
	  //console.log((new Date()).toLocaleString());
	  //console.log( (new Date()).getTimezoneOffset());
      const signature = signer.sign(private_key, 'base64');
	
xml = `<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:v1=\"http://rx-savings.medimpact.com/contract/PricingEngine/v1.0\">
                    <soapenv:Header/>
                    <soapenv:Body>
                       <v1:findDrugByNameRequest>
				<v1:clientAccountCode>CTI01</v1:clientAccountCode>
				<v1:token>cHHHT2hI/BDAUt9SEnloLwMF8MKgXY2YiBHUlsMU5FTJCBZqj5mgRQB5CtITinZUXm3jlCz4vCzwcSPabjJuhKCjhPd71w0L/K8qlMyXLemxJnZ8s6UZrJm2y0QGdCwr47A8SHYF50gNq13DvZfVtktsaoafrc1QylbsV0UMX43tRm0Ew2BE5lMc/6aqgQlgMMWeiELkTWPf+pJFPpABqBKazRvCXgVd1cCi++BmYIkT1IUqxvrPdVuiVZOu266NM4H88WhGMaeylIo9iKCvPZt3FE3JTIwS9lZCZyRgILdWKnp+w+krwGYPyYBew2oLEnyIogFP0ISdWrY1Xk1BTw==</v1:token>
				<v1:timestamp>${myTimeStamp}</v1:timestamp>
                          <v1:prefixText>${Temp}</v1:prefixText>
                          <!--Optional:-->
                          <v1:count>10</v1:count>
                       </v1:findDrugByNameRequest>
                    </soapenv:Body>
                 </soapenv:Envelope>`;

  
const verify = crypto.createVerify('RSA-SHA256');

verify.write(myTimeStamp);
verify.end();

console.log("--Your Private and pulic key verification done at client side. It must be true. -->>>>>>>>>>>> ",verify.verify(public_key, signature,'base64'));


  options = {
    method: "POST",
    url: "http://pv2medccws1:8080/cashcard-ws-v1_0/soap/cashcard",
    headers: {
      'Content-Type': 'text/xml',
	  'CC-Timestamp-Signature': signature
    },
    body: xml
  };
  return new Promise((resolve, reject) => {
	  
	  console.log("options ",options); 
    request(options, function(error, response) {
      if (error) {
		  console.log(error);
        reject(new Error(error)); // reject instead of throwing, handle with `catch`
        return;
      }
      text = response.body;
	  console.log("Response ::: ",text);
      parser = new DOMParser();
      xmlDoc = parser.parseFromString(text, "text/xml");
      xmlResult = xmlDoc.getElementsByTagName(`${elementToParse}`)[0].childNodes[0].nodeValue;
	  console.log(error);
      resolve(xmlResult);
    });
  });
};
exports.query = query
