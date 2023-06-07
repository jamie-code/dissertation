<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Export</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="./dist/sidebar-menu.css">
  <link rel="stylesheet" href="./css/jquery.dataTables.min.css">
  <script src="https://code.jquery.com/jquery-3.0.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
</head>
<!-- Some styling for https://github.com/huang-x-h/sidebar-menu-->
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
  .hide {
    visibility: hidden;
  }
  .context-menu-icon.context-menu-icon--fa {/*override weight from fa class which causes very bold text for share in context menu*/
    font-weight: inherit !important;
  }
  .card {/* FROM https://atranathemes.github.io/Atrana/layout-top-navigation.html */
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-clip: border-box;
    margin-top: 1vh;
  }
  .card-body{
    padding: 1.4rem 1.7rem;
    background-color: #ffffff;
    flex: 1 1 auto;
  }
  .form-font-weight{
    font-weight: 500;
  }
</style>
<body>
  <?php 
  $page="export";
  include("nav.php"); ?>
 
  <section class="content">
    <div class="content-header">
      <h1>Export</h1>
    </div>
    <div class="card">
        <div class="card-body">
            <form onsubmit="return false">
                <h3>Select which passwords to export</h3>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="checkbox" id="personalpasswords" name="personal" value="personal">
                    <label class="form-check-label form-font-weight" for="personal"> My Passwords</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="checkbox" name="shared" id="sharedpasswords" value="shared">
                    <label class="form-check-label form-font-weight" for="shared"> Passwords shared with me</label>
                </div>
                <div class="row g-3">
                    <div class="col-auto">
                        <span class="form-control-plaintext">Enter your master password</span>
                    </div>
                    <div class="col-auto">
                        <input type="password" class="form-control" id="inputPassword2" placeholder="Password">
                    </div>

                </div>
                <div class="col-auto">
                    <button type="submit" id="exportpasswords" class="btn btn-primary">Export</button>
                    <small id="errortext" class="form-text text-center text-danger"></small>
                </div>
            </form>
        </div>
    </div>
  </section>


  <script src="./js/jquery.dataTables.min.js"></script>
  <script src="./dist/sidebar-menu.js"></script>
  <script src="node_modules/argon2-browser/lib/argon2.js"></script>
  <script src="js/aes.js"></script>
  <script src="./js/functions/functions.js"></script>
  <script src="./js/export.js"></script>
  <script>
    $.sidebarMenu($('.sidebar-menu'))
  </script>
</body>

</html>
