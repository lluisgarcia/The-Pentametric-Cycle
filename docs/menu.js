(function(){
  var SECTIONS = [["u", "◆ Understand", "Explore the ideas of the papers interactively", [["spiral.html", "The spiral and Holden's lines", "Fibonacci squares, the point P and the ±4/5 square"], ["thirds.html", "Thirds and tenths", "Why Holden's lines cut every side at ⅓ and ⅔"], ["defects.html", "The ±0.8 correction", "How n²/5 becomes a whole number, and the last-digit rule"], ["pentagon.html", "The pentagon clock", "Why 5 decides everything, and why the palindrome exists"], ["monochord.html", "Monochord and tetractys", "Where the four consonances come from"], ["palindrome.html", "The playable palindrome", "Hear the 51-step cycle in just intonation"], ["explorer.html", "Formula explorer", "Follow any number through the seven steps"], ["identities.html", "Identities gallery", "Every exact relation of the construction, checked live"], ["forms.html", "Ten forms of one formula", "Ten routes to the same areas, all agreeing"], ["pentaspiral.html", "The Pentametric spiral", "Your areas around a pentagon, in 2D and 3D, and into the golden rectangle"]]], ["e", "✦ Exploratory", "Beyond the papers: explorations, not peer reviewed", [["primes.html", "Other primes", "Why only 5 works, and the 5-12-13 family"], ["cycle13.html", "The 13-cycle as music", "The palindrome with 13: every ratio from 2:1 to 12:11"], ["powers.html", "Higher powers of 5", "The cycle modulo 25, 125, 625 and beyond"], ["pell.html", "Pell numbers", "Does the trick work for another sequence? So far, no"], ["transitions.html", "The 24 transitions", "Which interval follows which, as a table and a map"], ["curiosity.html", "A curiosity: √10/3", "A ratio within 1 cent of the Pythagorean semitone"], ["angle.html", "The angle of 0.8", "arctan(4/5), its triangles, and the primes with square silences"]]], ["p", "⤓ Use it", "Make something and download it", [["composer.html", "Composer", "Turn numbers into music and download a MIDI file"], ["tapestry.html", "Residue tapestry", "Weave the sequence and download it as an image"], ["signature.html", "Name and date signature", "Your name or a date as a short piece and a card"], ["tuning.html", "Tuning file maker", "Download the cycle's scales as Scala (.scl) files"], ["rhythm.html", "Rhythm generator", "The cycle as a drum pattern, with MIDI download"], ["chords.html", "Chord progressions", "The cycle writes the harmony: I, IV, V, flamenco, MIDI"], ["poster.html", "Poster maker", "Prints, wallpapers and covers as SVG or PNG"]]]];
  var here = (location.pathname.split("/").pop() || "index.html");
  var cur = null; SECTIONS.forEach(function(s){ s[3].forEach(function(it){ if (it[0] === here) cur = s[0]; }); });
  function esc(t){ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;"); }
  var h = '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="sitenav"><span class="mt-open">☰ Menu</span><span class="mt-close">✕ Close</span></button>'
    + '<div class="nav-scrim" aria-hidden="true"></div><nav id="sitenav" class="drawer" aria-label="Site menu">'
    + '<div class="drawer-head"><span class="t">Menu</span><button class="menu-close" type="button">✕ Close</button></div>'
    + '<a class="home" href="index.html"' + (here === "index.html" ? ' aria-current="page"' : "") + '>⌂ Home</a>';
  SECTIONS.forEach(function(s){
    h += '<details class="' + s[0] + '"' + (s[0] === cur ? ' data-current="1"' : "") + '><summary><span class="sec">' + esc(s[1]) + '</span><span class="desc">' + esc(s[2]) + '</span></summary><ul>';
    s[3].forEach(function(it){ h += '<li><a href="' + it[0] + '"' + (it[0] === here ? ' aria-current="page"' : "") + '>' + esc(it[1]) + '<small>' + esc(it[2]) + '</small></a></li>'; });
    h += '</ul></details>';
  });
  h += '</nav>';
  var slot = document.querySelector("header.site nav"); if (!slot) return;
  var tmp = document.createElement("div"); tmp.innerHTML = h;
  var frag = document.createDocumentFragment(); while (tmp.firstChild) frag.appendChild(tmp.firstChild);
  slot.parentNode.replaceChild(frag, slot);

  var b=document.body, t=document.querySelector(".menu-toggle"), c=document.querySelector(".menu-close"), s=document.querySelector(".nav-scrim");
  var secs=[].slice.call(document.querySelectorAll("nav.drawer details")), KEY="pentametric-menu";
  var wide=function(){ return window.matchMedia("(min-width: 1000px)").matches; };
  function load(){ try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch(e){ return {}; } }
  function save(st){ try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch(e){} }
  var st=load();
  function set(o, keep){ b.classList.toggle("menu-open",o); if(t) t.setAttribute("aria-expanded",o); st.open=o; save(st);
    if(!keep){ if(o&&c) c.focus(); else if(t) t.focus(); } }
  // restore: the open section, and (on wide screens) the open menu, without animation
  secs.forEach(function(d){ if(st.sec && d.classList.contains(st.sec)) d.open=true; });
  if(st.open && wide()){ b.classList.add("no-anim"); set(true,true); requestAnimationFrame(function(){ requestAnimationFrame(function(){ b.classList.remove("no-anim"); }); }); }
  // one section open at a time
  secs.forEach(function(d){ d.addEventListener("toggle",function(){
    if(d.open){ secs.forEach(function(o){ if(o!==d) o.open=false; }); st.sec=d.classList[0]; }
    else if(st.sec===d.classList[0]) st.sec=null;
    save(st); }); });
  if(t) t.addEventListener("click",function(){ set(!b.classList.contains("menu-open")); });
  if(c) c.addEventListener("click",function(){ set(false); });
  if(s) s.addEventListener("click",function(){ set(false); });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&b.classList.contains("menu-open")) set(false); });
  window.dispatchEvent(new Event("resize"));      // pages that size canvases to their panel re-measure once the menu is in place
})();
