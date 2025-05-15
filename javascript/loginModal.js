// function setupLoginModal() {
//   const loginBtn = document.getElementById("loginBtn");
//   const loginModal = document.getElementById("loginModal");
  
//   if (!loginBtn || !loginModal) return;
  
//   loginBtn.onclick = function() {
//     loginModal.style.display = "block";
//   };
  
//   loginModal.querySelector(".close").onclick = function() {
//     loginModal.style.display = "none";
//   };
  
//   window.onclick = function(event) {
//     if (event.target === loginModal) {
//         loginModal.style.display = "none";
//     }
//   };  
// }