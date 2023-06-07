<?php
if(isset($_POST['email'])&&isset($_POST['pass'])&&isset($_POST['passconfirm'])){

}
?>
<!--Template from ColorLib.com-->
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Login</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
<!--===============================================================================================-->	
	<link rel="icon" type="image/png" href="images/icons/favicon.ico"/>
<!--===============================================================================================-->
	<link rel="stylesheet" type="text/css" href="vendor/bootstrap/css/bootstrap.min.css">
<!--===============================================================================================-->
	<link rel="stylesheet" type="text/css" href="fonts/font-awesome-4.7.0/css/font-awesome.min.css">
<!--===============================================================================================-->
	<link rel="stylesheet" type="text/css" href="vendor/animate/animate.css">
<!--===============================================================================================-->	
	<link rel="stylesheet" type="text/css" href="vendor/css-hamburgers/hamburgers.min.css">
<!--===============================================================================================-->
	<link rel="stylesheet" type="text/css" href="vendor/select2/select2.min.css">
<!--===============================================================================================-->
	<link rel="stylesheet" type="text/css" href="css/util.css">
	<link rel="stylesheet" type="text/css" href="css/main.css">
<!--===============================================================================================-->
<style>
.modal {
            
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.4rem;
            width: 450px;
            padding: 1.3rem;
            min-height: 250px;
            position: absolute;
            z-index: 2;
            top: 20%;
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 15px;
          }
          
          .modal .flex {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .modal input {
            padding: 0.7rem 1rem;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 0.9em;
          }
          
          .modal p {
            font-size: 0.9rem;
            color: #777;
            margin: 0.4rem 0 0.2rem;
          }
          
          button {
            cursor: pointer;
            border: none;
            font-weight: 600;
          }
          
          .btn {
            display: inline-block;
            padding: 0.8rem 1.4rem;
            font-weight: 700;
            background-color: black;
            color: white;
            border-radius: 5px;
            text-align: center;
            font-size: 1em;
          }
          
          .btn-open {
            position: absolute;
            bottom: 150px;
          }
          
          .btn-close {
            transform: translate(10px, -20px);
            padding: 0.5rem 0.7rem;
            background: #eee;
            border-radius: 50%;
          }
          
          .overlay {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(3px);
            z-index: 1;
          }
          
          .hidden {
            display: none;
          }
          th{
        
        background: #000;
        padding: 18px 0;
        color: white;
        width: 100%;
    }
    td {
        cursor: pointer;
    }
    tr{
        padding: 5px 5px;
        font-size:20px;
    }
    .even {
        background: #EEEEEE;
    }
    .odd {
        background: none;
    }
    table {
        width: -webkit-fill-available;
    }
</style>
</head>
<body>
<div class="modal-div">
            <section class="modal hidden"><!--https://codepen.io/evavic44/pen/zYjjzoV-->
                <div class="flex">
                    <button class="btn-close">⨉</button>
                </div>
                <div>
                    <h3>Select a key to login with</h3>
                    <table id="keytable" class="table table-striped">
                        <tr  class="bg-info">
                            <th>Name</th>
                        </tr>

                        <tbody id="keys">
                            
                        </tbody>
                    </table>

                    
                </div>

                
                <button class="btn">Do Something</button>
            </section>
        </div>
        <div class="overlay hidden"></div>
	<div class="limiter">
		<div class="container-login100">
			<div class="wrap-login100">
				<div class="login100-pic js-tilt" data-tilt>
					<img src="images/img-01.png" alt="IMG">
				</div>

				<form class="login100-form validate-form" method="post" method="login.php">
					<span class="login100-form-title">
						Login
					</span>

					<div class="wrap-input100 validate-input" data-validate = "Valid email is required: ex@abc.xyz">
						<input class="input100" type="text" name="email" placeholder="Email">
						<span class="focus-input100"></span>
						<span class="symbol-input100">
							<i class="fa fa-envelope" aria-hidden="true"></i>
						</span>
					</div>

					<div class="wrap-input100 validate-input" data-validate = "Passwords are 8 characters or more">
						<input class="input100" id="password" type="password" name="pass" maxlength="500" placeholder="Password">
						<span class="focus-input100"></span>
						<span class="symbol-input100">
							<i class="fa fa-lock" aria-hidden="true"></i>
						</span>
					</div>
					<small id="errortext" class="form-text text-center text-danger"></small>
					<div class="container-login100-form-btn">
						<button class="login100-form-btn">
							Login
						</button>
					</div>


					<div class="text-center p-t-136">
						<a class="txt2" href="register.php">
							Don't have an account? Register
							<i class="fa fa-long-arrow-right m-l-5" aria-hidden="true"></i>
						</a>
					</div>
				</form>
			</div>
		</div>
	</div>
	
	

	
<!--===============================================================================================-->	
	<script src="vendor/jquery/jquery-3.2.1.min.js"></script>
<!--===============================================================================================-->
	<script src="vendor/bootstrap/js/popper.js"></script>
	<script src="vendor/bootstrap/js/bootstrap.min.js"></script>
<!--===============================================================================================-->
	<script src="vendor/select2/select2.min.js"></script>
<!--===============================================================================================-->
	<script src="vendor/tilt/tilt.jquery.min.js"></script>
	<script >
		$('.js-tilt').tilt({
			scale: 1.1
		})
	</script>
<!--===============================================================================================-->
	<script src="node_modules/argon2-browser/lib/argon2.js"></script>
	<script src="js/aes.js"></script>
	<script src="newbundle.js"></script>
	<!--<script src="js/login.js"></script>-->

</body>
</html>