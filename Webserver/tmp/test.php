<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>

<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">

<style>
    th{ 
        color:#fff;
            }
</style>


<table class="table table-striped">
    <tr  class="bg-info">
        <th>Name</th>
        <th>Age</th>
        <th>Birthday</th>
    </tr>

    <tbody id="myTable">
        
    </tbody>
</table>

<script>
	async function pfetch(url, body){
    let call = await fetch(url, {
        method: 'POST',
        headers: {
            'content-type': 'Application/Json'
        },
        body: body
    });
    if(!call.ok){
        throw new Error("Http Error: ${call.status}");//if there is an error code such as 502, 404
    }
    let result = await call.text();
    console.log(call);
    console.log(result);
    if(result=="Invalid Session"){
        sendtoLogin();
        return;
    } else {
        return result;
    }
}
$(document).ready(async function() { 
	let vault = await pfetch("https://api.jamiez.co.uk/pwdmanager/vault", JSON.stringify({
                    email: "jamie360.bat@gmail.com",
                    sessionid: "fi04NFM5WkxhRztUS1FHVWhLLzQrKSZiVGt7ViZFMUElfSxQWVZ2UFgtZXo5WmVeIzg="
                }))
			console.log(vault);
})

</script>