import{renderAllHudMiiAvatars as P,renderMiiAvatar as L}from"./mii_avatars.js";

export const CORE_DAO_LEVELS = Array.from({ length: 50 }, (_, i) => {
  const lvl = i + 1;
  let name = `Level ${lvl}: `;
  let diff = 'casual';
  let opponent = 'Club AI';
  let reward = lvl * 25;
  if (lvl === 1) { name += 'Satoshi Genesis'; diff = 'casual'; opponent = 'Satoshi Rookie'; }
  else if (lvl <= 10) { name += `Hash Power ${lvl}`; diff = 'casual'; opponent = `Validator ${lvl}`; }
  else if (lvl <= 25) { name += `Delegator Circuit ${lvl}`; diff = 'pro'; opponent = `Master Validator ${lvl}`; }
  else if (lvl <= 40) { name += `Satoshi Plus Arena ${lvl}`; diff = 'pro'; opponent = `Core Champion ${lvl}`; }
  else if (lvl < 50) { name += `Ecosystem Titan ${lvl}`; diff = 'pro'; opponent = `Epic Core Master ${lvl}`; }
  else { name += 'Grand Satoshi Championship'; diff = 'pro'; opponent = 'Satoshi Supreme'; reward = 5000; }
  return { level: lvl, name, difficulty: diff, opponent, reward, gamesToWin: lvl > 35 ? 3 : lvl > 15 ? 2 : 1 };
});

export class HudUI{
  constructor(t={}){
    this.callbacks=t;
    this.bannerTimer=null;
    this.timingPopupTimer=null;
    this.skillHistory=[980,1005,1030,1065,1120];
    this.selectedGamesToWin=2;
    this.selectedInputMode="mouse";
    this.selectedDifficulty="casual";
    this.currentRoomId="default";
    this.currentTunnelUrl="https://argon-tennis-sandbox-170440.uc.r.appspot.com";
    this.elTitleModal=document.getElementById("title-modal");
    this.elCoreDaoModal=document.getElementById("core-dao-modal");
    this.elCharacterModal=document.getElementById("character-modal");
    this.elSettingsModal=document.getElementById("settings-modal");
    this.elAchievementsModal=document.getElementById("achievements-modal");
    this.elCompanionModal=document.getElementById("companion-modal");
    this.elVictoryModal=document.getElementById("victory-modal");
    this.elScoreCenter=document.getElementById("score-center-display");
    this.elScorePlayer=document.getElementById("score-player-text");
    this.elScoreSep=document.getElementById("score-separator");
    this.elScoreOpponent=document.getElementById("score-opponent-text");
    this.elGamesPlayer=document.getElementById("games-pill-player");
    this.elGamesOpponent=document.getElementById("games-pill-opponent");
    this.elServerTag=document.getElementById("server-tag");
    this.elPlayerNameplate=document.getElementById("player-nameplate");
    this.elTimingPopup=document.getElementById("timing-popup");
    this.elTimingGrade=document.getElementById("timing-popup-grade");
    this.elTimingDetail=document.getElementById("timing-popup-detail");
    this.elBannerLayer=document.getElementById("center-banner-layer");
    this.elBannerText=document.getElementById("center-banner-text");
    this.elBannerSub=document.getElementById("center-banner-sub");
    this.elReplayBadge=document.getElementById("replay-badge");
    this.elTimingCursor=document.getElementById("timing-cursor");
    this.elGaugeModeTitle=document.getElementById("gauge-mode-title");
    this.elGaugeSpeedReadout=document.getElementById("gauge-speed-readout");
    this.elAudioDot=document.getElementById("audio-status-dot");
    this.elAudioLabel=document.getElementById("audio-track-label");
    this.elCameraLabel=document.getElementById("camera-mode-label");
    this.elWebcamPip=document.getElementById("webcam-pip-card");
    this.elWebcamDot=document.getElementById("webcam-status-dot");
    this.elPhoneDot=document.getElementById("phone-status-dot");
    this.elPhoneLabel=document.getElementById("phone-status-label");
    this.elOpponentPresencePill=document.getElementById("opponent-presence-pill");
    this.elOpponentPresenceText=document.getElementById("opponent-presence-text");
    this._lastRoomStatus={};
    this._lastOtherReady=!1;
    this._justJoinedTimer=null;
    this._loadUserSettings();
    this._renderAllMiiPortraits();
    this._bindEvents();
    this._initUrlParamsState();
    this.renderCoreDaoGrid();
  }

  _renderAllMiiPortraits(){P()}
  _drawMiiFace(t,n={}){L(t,n.characterId||t?.id||"player1",n)}

  _loadUserSettings(){
    try{
      const s = JSON.parse(localStorage.getItem("argon_user_settings")||"{}");
      if(s.tint){
        document.querySelectorAll(".char-tint-choice").forEach(b=>{
          b.classList.toggle("selected", b.dataset.tint === s.tint);
        });
      }
      if(s.skin){
        document.querySelectorAll(".racket-skin-choice").forEach(b=>{
          b.classList.toggle("selected", b.dataset.skin === s.skin);
        });
      }
      if(s.gfx){
        document.querySelectorAll(".gfx-choice").forEach(b=>{
          b.classList.toggle("selected", b.dataset.gfx === s.gfx);
        });
      }
      const vol = document.getElementById("settings-volume");
      if(vol && s.volume !== undefined) vol.value = s.volume;
    }catch{}
  }

  _saveUserSettings(){
    try{
      const activeTint = document.querySelector(".char-tint-choice.selected")?.dataset.tint || "player-tint";
      const activeSkin = document.querySelector(".racket-skin-choice.selected")?.dataset.skin || "gold";
      const activeGfx = document.querySelector(".gfx-choice.selected")?.dataset.gfx || "high";
      const vol = document.getElementById("settings-volume")?.value || "0.8";
      localStorage.setItem("argon_user_settings", JSON.stringify({tint: activeTint, skin: activeSkin, gfx: activeGfx, volume: parseFloat(vol)}));
    }catch{}
  }

  _initUrlParamsState(){
    const t=new URLSearchParams(window.location.search);
    const n=(t.get("room")||"").trim().toUpperCase();
    const e=(t.get("role")||"p1").trim().toLowerCase()==="p2"?"p2":"p1";
    const i=(t.get("mode")||t.get("difficulty")||"").toLowerCase();
    if(this.playerRole=e,n&&n!=="DEFAULT"?(this.currentRoomId=n,this._setDifficultySelection("1v1",{notify:!1})):["casual","pro","1v1"].includes(i)&&this._setDifficultySelection(i,{notify:!1}),e==="p2"){
      const o=document.querySelector(".you-tag");o&&(o.textContent="Player 1");
      const s=document.getElementById("setup-opponent-label");s&&(s.textContent="You")
    }
    this.updateMultiplayerRoomInfo({roomId:this.currentRoomId,tunnelUrl:this.currentTunnelUrl,role:this.playerRole})
  }

  getCoreProgress(){
    try{
      const d=localStorage.getItem("core_dao_tennis_save");
      if(d)return JSON.parse(d);
    }catch{}
    return {unlockedLevel:1,tokens:150,levels:{}};
  }

  saveCoreProgress(p){
    try{localStorage.setItem("core_dao_tennis_save",JSON.stringify(p));}catch{}
  }

  renderCoreDaoGrid(filter=""){
    const grid=document.getElementById("core-levels-grid");
    if(!grid)return;
    const prog=this.getCoreProgress();
    let totalStars=0;
    Object.values(prog.levels||{}).forEach(l=>{totalStars+=(l.stars||0);});
    const tokensEl=document.getElementById("core-tokens-badge");
    const starsEl=document.getElementById("core-stars-badge");
    if(tokensEl)tokensEl.textContent=`🪙 ${prog.tokens||0} CORE`;
    if(starsEl)starsEl.textContent=`⭐ ${totalStars} / 150 Stars`;

    grid.innerHTML="";
    const q = filter.trim().toLowerCase();
    CORE_DAO_LEVELS.forEach(lvl=>{
      if(q && !lvl.name.toLowerCase().includes(q) && !lvl.opponent.toLowerCase().includes(q) && !String(lvl.level).includes(q)){
        return;
      }
      const isUnlocked=lvl.level<=(prog.unlockedLevel||1);
      const lvlData=prog.levels?.[lvl.level]||{};
      const stars=lvlData.stars||0;
      const completed=lvlData.completed||false;

      const tile=document.createElement("div");
      tile.className=`core-level-tile ${isUnlocked?"":"locked"} ${completed?"completed":""}`;
      tile.innerHTML=`
        <div class="tile-lvl-num">Level ${lvl.level}</div>
        <div class="tile-lvl-name" title="${lvl.name}">${lvl.opponent}</div>
        <div class="tile-stars">${isUnlocked?(stars>0?"⭐".repeat(stars):"☆"): "🔒"}</div>
      `;
      if(isUnlocked){
        tile.addEventListener("click",()=>{
          this.closeCoreDaoModal();
          this.hideTitleModal();
          if(this.callbacks.onSelectCampaignLevel){
            this.callbacks.onSelectCampaignLevel(lvl);
          }
        });
      }
      grid.appendChild(tile);
    });
  }

  openCoreDaoModal(){
    this.renderCoreDaoGrid();
    if(this.elCoreDaoModal)this.elCoreDaoModal.classList.remove("hidden");
  }
  closeCoreDaoModal(){
    if(this.elCoreDaoModal)this.elCoreDaoModal.classList.add("hidden");
  }

  openCharacterModal(){
    if(this.elCharacterModal)this.elCharacterModal.classList.remove("hidden");
  }
  closeCharacterModal(){
    this._saveUserSettings();
    if(this.elCharacterModal)this.elCharacterModal.classList.add("hidden");
  }

  openSettingsModal(){
    if(this.elSettingsModal)this.elSettingsModal.classList.remove("hidden");
  }
  closeSettingsModal(){
    this._saveUserSettings();
    if(this.elSettingsModal)this.elSettingsModal.classList.add("hidden");
  }

  openAchievementsModal(){
    const prog = this.getCoreProgress();
    let totalStars = 0;
    Object.values(prog.levels||{}).forEach(l=>{totalStars+=(l.stars||0);});
    
    const ach1 = document.getElementById("ach-1-status");
    const ach2 = document.getElementById("ach-2-status");
    const ach3 = document.getElementById("ach-3-status");
    
    if(ach1) {
      const ok = (prog.tokens||0) >= 500;
      ach1.textContent = ok ? "UNLOCKED" : `${prog.tokens||0}/500`;
      ach1.style.color = ok ? "#4ade80" : "#94a3b8";
    }
    if(ach2) {
      const ok = totalStars >= 50;
      ach2.textContent = ok ? "UNLOCKED" : `${totalStars}/50`;
      ach2.style.color = ok ? "#4ade80" : "#94a3b8";
    }
    if(ach3) {
      const ok = (prog.levels?.[50]?.completed);
      ach3.textContent = ok ? "UNLOCKED" : "LOCKED";
      ach3.style.color = ok ? "#4ade80" : "#94a3b8";
    }

    if(this.elAchievementsModal)this.elAchievementsModal.classList.remove("hidden");
  }
  closeAchievementsModal(){
    if(this.elAchievementsModal)this.elAchievementsModal.classList.add("hidden");
  }

  _setDifficultySelection(t,{notify:n=!0}={}){
    const e=["casual","pro","1v1"].includes(t)?t:"casual";
    this.selectedDifficulty=e;
    document.querySelectorAll("#difficulty-mode-group .wii-green-choice").forEach(a=>{a.classList.toggle("selected",a.dataset.difficulty===e)});
    const o=document.getElementById("match-length-section");
    if(e==="1v1")o&&o.classList.add("hidden"),this.selectedGamesToWin=1,this.configureGameBubbles(1),n&&this.callbacks.onSelectMatchLength&&this.callbacks.onSelectMatchLength(1);
    else{
      o&&o.classList.remove("hidden");
      const a=document.querySelector("#match-length-group .wii-green-choice.selected");
      const r=parseInt(a?.dataset?.games||"3",10);
      this.selectedGamesToWin=Math.ceil(r/2);
      this.configureGameBubbles(this.selectedGamesToWin);
      n&&this.callbacks.onSelectMatchLength&&this.callbacks.onSelectMatchLength(this.selectedGamesToWin)
    }
    const s=document.getElementById("setup-opponent-label");
    s&&this.playerRole!=="p2"&&(e==="1v1"?s.textContent="Player 2":e==="pro"?s.textContent="Matt":s.textContent="Club AI");
    this.updateOpponentPresence(this._lastRoomStatus||{});
    n&&this.callbacks.onSelectDifficulty&&this.callbacks.onSelectDifficulty(e)
  }

  _bindEvents(){
    document.querySelectorAll("#difficulty-mode-group .wii-green-choice").forEach(l=>{
      l.addEventListener("click",()=>{const c=l.dataset.difficulty||"casual";this._setDifficultySelection(c,{notify:!0})})
    });
    const n=document.querySelectorAll("#match-length-group .wii-green-choice");
    n.forEach(l=>{
      l.addEventListener("click",()=>{
        n.forEach(u=>u.classList.remove("selected"));
        l.classList.add("selected");
        const c=parseInt(l.dataset.games||"3",10);
        this.selectedGamesToWin=Math.ceil(c/2);
        this.configureGameBubbles(this.selectedGamesToWin);
        this.callbacks.onSelectMatchLength&&this.callbacks.onSelectMatchLength(this.selectedGamesToWin)
      })
    });

    const btnOpenCore=document.getElementById("btn-open-core-dao");
    btnOpenCore&&btnOpenCore.addEventListener("click",()=>this.openCoreDaoModal());
    const btnCloseCore=document.getElementById("btn-close-core-dao");
    btnCloseCore&&btnCloseCore.addEventListener("click",()=>this.closeCoreDaoModal());

    const searchInput = document.getElementById("level-search-input");
    searchInput&&searchInput.addEventListener("input",(e)=>{
      this.renderCoreDaoGrid(e.target.value);
    });

    const btnOpenChar=document.getElementById("btn-open-character");
    btnOpenChar&&btnOpenChar.addEventListener("click",()=>this.openCharacterModal());
    const btnCloseChar=document.getElementById("btn-close-character");
    btnCloseChar&&btnCloseChar.addEventListener("click",()=>this.closeCharacterModal());

    document.querySelectorAll(".char-tint-choice").forEach(b=>{
      b.addEventListener("click",()=>{
        document.querySelectorAll(".char-tint-choice").forEach(x=>x.classList.remove("selected"));
        b.classList.add("selected");
        this._saveUserSettings();
      });
    });

    document.querySelectorAll(".racket-skin-choice").forEach(b=>{
      b.addEventListener("click",()=>{
        document.querySelectorAll(".racket-skin-choice").forEach(x=>x.classList.remove("selected"));
        b.classList.add("selected");
        this._saveUserSettings();
      });
    });

    const btnOpenSets=document.getElementById("btn-open-settings");
    btnOpenSets&&btnOpenSets.addEventListener("click",()=>this.openSettingsModal());
    const btnCloseSets=document.getElementById("btn-close-settings");
    btnCloseSets&&btnCloseSets.addEventListener("click",()=>this.closeSettingsModal());

    document.querySelectorAll(".gfx-choice").forEach(b=>{
      b.addEventListener("click",()=>{
        document.querySelectorAll(".gfx-choice").forEach(x=>x.classList.remove("selected"));
        b.classList.add("selected");
        this._saveUserSettings();
      });
    });

    const btnResetSave=document.getElementById("btn-reset-save");
    btnResetSave&&btnResetSave.addEventListener("click",()=>{
      if(confirm("Are you sure you want to reset all campaign progress and saved data?")){
        localStorage.removeItem("core_dao_tennis_save");
        this.showTimingPopup({grade:"PROGRESS RESET",detail:"Campaign data cleared.",durationMs:2000});
        this.renderCoreDaoGrid();
      }
    });

    const btnOpenAch=document.getElementById("btn-open-achievements");
    btnOpenAch&&btnOpenAch.addEventListener("click",()=>this.openAchievementsModal());
    const btnCloseAch=document.getElementById("btn-close-achievements");
    btnCloseAch&&btnCloseAch.addEventListener("click",()=>this.closeAchievementsModal());

    let deferredPwaPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
      const btnInstall = document.getElementById("btn-install-pwa");
      if (btnInstall) btnInstall.style.display = "flex";
    });

    const btnInstallPwa = document.getElementById("btn-install-pwa");
    btnInstallPwa&&btnInstallPwa.addEventListener("click", async () => {
      if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        const { outcome } = await deferredPwaPrompt.userChoice;
        if (outcome === 'accepted') {
          this.showTimingPopup({grade: "APP INSTALLED", detail: "Ready for Offline Play!", durationMs: 2000});
        }
        deferredPwaPrompt = null;
      } else {
        const prog=this.getCoreProgress();
        const dataStr="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(prog,null,2));
        const dlAnchor=document.createElement('a');
        dlAnchor.setAttribute("href",dataStr);
        dlAnchor.setAttribute("download",`core_dao_tennis_save_${Date.now()}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        alert("To play offline anytime: In Chrome/Edge, click the browser menu (⋮) -> 'Install Argon Tennis' or 'Add to Home Screen'. Your progress is saved locally!");
      }
    });

    const btnDownload=document.getElementById("btn-download-game");
    btnDownload&&btnDownload.addEventListener("click",()=>{
      const prog=this.getCoreProgress();
      const dataStr="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(prog,null,2));
      const dlAnchor=document.createElement('a');
      dlAnchor.setAttribute("href",dataStr);
      dlAnchor.setAttribute("download",`core_dao_tennis_save_${Date.now()}.json`);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
      this.showTimingPopup({grade:"SAVE DOWNLOADED",detail:"Core DAO Progress Exported!",durationMs:1500});
    });

    const i=document.getElementById("btn-start-match");
    i&&i.addEventListener("click",()=>{
      this.hideTitleModal();
      this.callbacks.onStartMatch&&this.callbacks.onStartMatch({gamesToWin:this.selectedGamesToWin,inputMode:this.selectedInputMode,difficulty:this.selectedDifficulty})
    });

    const o=document.getElementById("btn-audio-toggle");
    o&&o.addEventListener("click",l=>{l.stopPropagation(),this.callbacks.onToggleAudio&&this.callbacks.onToggleAudio()});
    const s=document.getElementById("btn-camera-cycle");
    s&&s.addEventListener("click",l=>{l.stopPropagation(),this.callbacks.onCycleCamera&&this.callbacks.onCycleCamera()});
    const a=document.getElementById("btn-replay-trigger");
    a&&a.addEventListener("click",l=>{l.stopPropagation(),this.callbacks.onToggleReplay&&this.callbacks.onToggleReplay()});
    const r=document.getElementById("btn-webcam-toggle");
    r&&r.addEventListener("click",l=>{l.stopPropagation(),this.callbacks.onToggleWebcam&&this.callbacks.onToggleWebcam()});
    const m=document.getElementById("btn-phone-racket");
    m&&m.addEventListener("click",l=>{l.stopPropagation(),this.openMultiplayerModal()});
    const p=document.getElementById("btn-multiplayer-modal");
    p&&p.addEventListener("click",l=>{l.stopPropagation(),this.openMultiplayerModal()});

    const b=document.getElementById("btn-close-companion");
    b&&b.addEventListener("click",()=>{this.elCompanionModal&&this.elCompanionModal.classList.add("hidden")});
    const B=document.getElementById("btn-play-again");
    B&&B.addEventListener("click",()=>{this.hideVictoryModal(),this.callbacks.onPlayAgain&&this.callbacks.onPlayAgain()});
    const T=document.getElementById("btn-return-title");
    T&&T.addEventListener("click",()=>{this.hideVictoryModal(),this.showTitleModal()})
  }

  async openMultiplayerModal(){
    if(this.elCompanionModal){
      try{
        const t=await fetch("/api/tunnel/status",{cache:"no-store"});
        if(t.ok){
          const n=await t.json();
          if(n.tunnelUrl){this.currentTunnelUrl=n.tunnelUrl;const e=document.getElementById("tunnel-url-input");e&&(e.value=n.tunnelUrl)}
        }
      }catch{}
      this.updateMultiplayerRoomInfo({roomId:this.currentRoomId,tunnelUrl:this.currentTunnelUrl});
      this.elCompanionModal.classList.remove("hidden")
    }
  }

  hideTitleModal(){
    document.documentElement.classList.add("autoplay-mode");
    this.elTitleModal&&(this.elTitleModal.classList.add("hidden"),this.elTitleModal.style.display="none")
  }

  showTitleModal(){
    document.documentElement.classList.remove("autoplay-mode");
    this.elTitleModal&&(this.elTitleModal.classList.remove("hidden"),this.elTitleModal.style.display="flex")
  }

  hideVictoryModal(){this.elVictoryModal&&this.elVictoryModal.classList.add("hidden")}

  showVictoryModal({playerWon:t,playerGames:n,opponentGames:e,campaignInfo:ci=null}){
    if(!this.elVictoryModal)return;
    const i=document.getElementById("victory-result-banner"),o=document.getElementById("victory-match-score"),s=document.getElementById("skill-rating-value");
    if(ci){
      if(i){
        i.textContent=t?`LEVEL ${ci.level} CLEARED!`: "LEVEL FAILED";
        i.style.color=t?"#ffea28":"#ff6b6b";
      }
      if(o){
        o.textContent=t?`Earned +${ci.reward} CORE Tokens! ⭐+${ci.stars}`:`Final Games: ${n} - ${e}`;
      }
    }else{
      i&&(i.textContent=t?"YOU WIN!":"TRY AGAIN!",i.style.color=t?"#ffea28":"#9ad4ff");
      o&&(o.textContent=`Final Games: ${n} - ${e}`);
    }
    const a=t?1145:1020;
    s&&(s.textContent=String(a));
    this._drawSkillGraph(t);
    this.elVictoryModal.classList.remove("hidden")
  }

  _drawSkillGraph(t){
    const n=document.getElementById("skill-graph-canvas");
    if(!n)return;
    const e=n.getContext("2d"),i=n.width,o=n.height;
    e.clearRect(0,0,i,o);
    e.fillStyle="#f8fbff";
    e.fillRect(0,0,i,o);
    e.strokeStyle="#d0dce8";
    e.lineWidth=1;
    for(let p=25;p<o;p+=35){e.beginPath();e.moveTo(0,p);e.lineTo(i,p);e.stroke()}
    const s=o*.56;
    e.strokeStyle="#9aaab8";
    e.setLineDash([4,4]);
    e.beginPath();e.moveTo(0,s);e.lineTo(i,s);e.stroke();
    e.setLineDash([]);
    e.fillStyle="#6c7c8c";
    e.font="bold 11px sans-serif";
    e.fillText("PRO 1000",8,s-5);
    const a=t?[.74,.66,.58,.45,.24]:[.74,.66,.58,.52,.55];
    e.strokeStyle="#1f96f2";
    e.lineWidth=3.5;
    e.lineCap="round";
    e.lineJoin="round";
    e.beginPath();
    a.forEach((p,g)=>{const y=24+g/(a.length-1)*(i-48),f=o*p;g===0?e.moveTo(y,f):e.lineTo(y,f)});
    e.stroke();
    const r=i-24,m=o*a[a.length-1];
    e.fillStyle="#ffea28";
    e.beginPath();e.arc(r,m,6,0,Math.PI*2);e.fill();
    e.strokeStyle="#006cc4";
    e.lineWidth=2;
    e.stroke();
  }

  updateMultiplayerRoomInfo(t={}){
    this.currentRoomId=t.roomId||this.currentRoomId;
    this.currentTunnelUrl=t.tunnelUrl||this.currentTunnelUrl;
    const n=document.getElementById("companion-qr");
    if(n&&this.currentTunnelUrl){
      n.src=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${this.currentTunnelUrl}/companion.html?room=${this.currentRoomId}&role=p1`)}`;
    }
    const e=document.getElementById("companion-link");
    if(e&&this.currentTunnelUrl){
      e.href=`/companion.html?room=${this.currentRoomId}&role=p1`;
    }
  }

  updateOpponentPresence(t={}){
    this._lastRoomStatus=t;
    const n=document.getElementById("opponent-presence-pill");
    const e=document.getElementById("opponent-presence-text");
    if(!n||!e)return;
    if(this.selectedDifficulty==="1v1"){
      n.classList.remove("hidden");
      if(t.p2PhoneConnected||t.p2Online){
        n.classList.add("ready");
        e.textContent="Player 2 Connected!";
      }else{
        n.classList.remove("ready");
        e.textContent=`Waiting for Player 2 (Room: ${this.currentRoomId})…`;
      }
    }else{
      n.classList.add("hidden");
    }
  }

  showTimingPopup(opts={}){
    const t=opts.grade||"PERFECT";
    const n=opts.detail||"";
    const durationMs=opts.durationMs||1200;
    if(!this.elTimingPopup)return;
    if(this.timingPopupTimer)clearTimeout(this.timingPopupTimer);
    this.elTimingGrade.textContent=t;
    this.elTimingGrade.className=`timing-grade grade-${t.toLowerCase()}`;
    this.elTimingDetail.textContent=n;
    this.elTimingPopup.classList.remove("hidden");
    this.timingPopupTimer=setTimeout(()=>{
      this.elTimingPopup.classList.add("hidden");
    },durationMs);
  }

  configureGameBubbles(gamesToWin){
    [this.elGamesPlayer,this.elGamesOpponent].forEach(pill=>{
      if(!pill)return;
      const bubbles = pill.querySelectorAll(".game-bubble");
      bubbles.forEach((b, idx)=>{
        if(gamesToWin === 1){
          if(idx === 0) b.classList.remove("hidden");
          else b.classList.add("hidden");
        } else if(gamesToWin === 2){
          if(idx < 2) b.classList.remove("hidden");
          else b.classList.add("hidden");
        } else {
          b.classList.remove("hidden");
        }
      });
    });
  }
}
