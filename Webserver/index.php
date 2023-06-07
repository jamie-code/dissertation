<html>
    <head></head><!--style for model from https://codepen.io/evavic44/pen/zYjjzoV-->
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <style>
body{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    min-height: 100vh;
}
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

    </style>
<style>
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
    <input type="text" name="username" id="email" placeholder="i.e. foo@bar.com">
        <button id="register">Start Registration</button>
        <button id="login">Start Login</button>
        <div id="message"></div>
        <script type="module" src="bundle.js"></script>
        
        
        
    </body>
</html>