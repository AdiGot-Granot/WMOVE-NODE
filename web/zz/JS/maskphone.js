//*******************************************************
//*******************************************************
  var phone1 = document.getElementById('phone1');

  phone1.addEventListener('input', function (e) {
  var x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,8})/);
  e.target.value = !x[2] ? x[1] : x[1] + '-' + x[2] + (x[3] ? '-' + x[3] : '');
 });
 