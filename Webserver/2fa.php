<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8"><!--https://github.com/huang-x-h/sidebar-menu-->
  <title>Dashboard</title>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
  <link rel="stylesheet" href="./dist/sidebar-menu.css">
  <link rel="stylesheet" href="./css/jquery.dataTables.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
</head>
<style>
  html,
  body {
    margin:0;
    padding:0;
  }
  body{
    height:100vh;
    background-color: #ebf3ff;
    display: flex;
  }
  * {
  box-sizing: border-box;
  }
  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .content {
    height:100%;
    flex:1;
    max-height: 100%;
    padding: 16px;
  }
  .headermargin{
    margin-top: 20px;
    margin-bottom: 10px;
  }
  .modal-backdrop.show {
    opacity: .5;
  }
  .same-line {
    display: flex;
    justify-content: center;
  }
  .same-line-right {
    display: flex;
    justify-content: right;
  }
  .close-right{
    position: absolute;
    right: 16px;
  }
  .context-menu-icon-delete{
    color: red !important;
  }
  .context-menu-icon::before{
    color: inherit !important;
  }
</style>
<body>
  <?php 
  $page="2fa";
  include("nav.php"); ?>
 
  <section class="content">
    <div class="content-header">
      <h1>2FA Keys</h1>
      <button class="btn btn-primary headermargin" data-toggle="modal" data-target="#myModal">Add A Key</button>
    </div>
    <!-- The Modal --><!-- https://www.w3schools.com/bootstrap4/tryit.asp?filename=trybs_modal_scroll2&stacked=h-->
  <div class="modal" id="myModal">
    <div class="modal-dialog modal-dialog-scrollable modal-lg">
      <div class="modal-content">
      
        <!-- Modal Header -->
        <div class="modal-header same-line">
          <h1 class="modal-title text-center">Add A Key</h1>
          <button type="button" class="close close-right" data-dismiss="modal">×</button>
        </div>
        
        <!-- Modal body -->
        <div class="modal-body">
          <form onsubmit="false"><!--Dont allow form submission as handled seperately by the buttons-->
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" class="form-control add-key" id="name" aria-describedby="nameHelp" placeholder="Name">
              <small id="urlHelp" class="form-text text-muted">This will be used as a nickname to identify your key.</small>
            </div>
          </form>
        </div>
        
        <!-- Modal footer -->
        <div class="modal-footer">
          <div class="same-line-right">
            <button type="submit" class="btn btn-success" id="register-key">Register</button>
          
          <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
        </div>
        </div>
        
      </div>
    </div>
  </div>
  <div>
    <table id="keys" class="display" width="100%"></table>
  </div>
  </section>

  <script src="./js/jquery.dataTables.min.js"></script>
  <script src="./dist/sidebar-menu.js"></script>
  <link rel="stylesheet" href="js/contextmenu/jquery.contextMenu.min.css"><!-- FROM http://swisnl.github.io/jQuery-contextMenu/index.html -->
  <script src="js/contextmenu/jquery.contextMenu.js"></script>
  <script src="js/contextmenu/jquery.ui.position.min.js"></script>
  <script src="./js/functions/functions.js"></script>
  <script src="./js/cbor.js"></script><!--From https://github.com/milesstoetzner/WebAuthn-Node.js-Demo/blob/master/public/javascripts/cbor.js -->
  <script src="./js/2fa.js"></script>
  <script>
    $.sidebarMenu($('.sidebar-menu'))
  </script>
</body>

</html>
