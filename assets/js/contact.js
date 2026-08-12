/* R-each contact form
 *
 * ■ 送信方式の切り替え（ここだけ変えれば切り替わります）
 *
 *   WEB3FORMS_KEY が空 → 「メーラー起動方式」
 *       記入内容を差し込んだ状態で、利用者のメールアプリが開きます。
 *
 *   WEB3FORMS_KEY にアクセスキーを入れる → 「ページ内から直接送信」
 *       メールアプリを開かずに、そのまま reach.app.support@gmail.com へ届きます。
 *
 * ■ アクセスキーの取り方（無料・クレジットカード不要）
 *   1. https://web3forms.com/ を開く
 *   2. 「Create your Form」に reach.app.support@gmail.com を入力
 *   3. 届いた確認メールのアクセスキー（英数字の文字列）を、下の "" の中に貼る
 *
 *   無料プランは月250通まで。それを超える見込みが出たら有料プランへ。
 */
(function () {
  "use strict";

  var WEB3FORMS_KEY = "";
  var WEB3FORMS_URL = "https://api.web3forms.com/submit";
  var TO = "reach.app.support@gmail.com";

  var form = document.getElementById("contactForm");
  if (!form) return;

  var statusEl = document.getElementById("formStatus");
  var copyBtn = document.getElementById("formCopy");
  var submitBtn = document.getElementById("formSubmit");

  function lang() {
    return document.documentElement.getAttribute("data-l") === "en" ? "en" : "ja";
  }

  function val(name) {
    var el = form.elements[name];
    if (!el) return "";
    /* チェックボックスの value は未チェックでも "on" を返すため、状態で判定する */
    if (el.type === "checkbox") return el.checked ? el.value : "";
    return el.value.trim();
  }

  /* option 要素の中身はテキストのみ有効なため、ラベルは data 属性で持たせている */
  function selectedLabel(name) {
    var el = form.elements[name];
    if (!el || el.selectedIndex < 0) return "";
    var opt = el.options[el.selectedIndex];
    return (opt.getAttribute("data-" + lang()) || opt.textContent).trim();
  }

  /* 言語切替に追従して、選択肢とプレースホルダを差し替える */
  function applyLang() {
    var l = lang();
    form.querySelectorAll("option[data-ja]").forEach(function (opt) {
      var t = opt.getAttribute("data-" + l);
      if (t) opt.textContent = t;
    });
    form.querySelectorAll("[data-ph-ja]").forEach(function (el) {
      var t = el.getAttribute("data-ph-" + l);
      if (t) el.placeholder = t;
    });
  }
  applyLang();
  new MutationObserver(applyLang).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-l"]
  });

  /* 送信方式に応じて、フォーム下の説明文を出し分ける */
  (function () {
    var direct = !!WEB3FORMS_KEY;
    var m = form.querySelector(".mode-mailto");
    var dEl = form.querySelector(".mode-direct");
    if (m) m.hidden = direct;
    if (dEl) dEl.hidden = !direct;
  })();

  function buildSubject() {
    return "[R-each] " + selectedLabel("app") + " / " + selectedLabel("category");
  }

  function buildBody() {
    var ja = lang() === "ja";
    var rows = [
      [ja ? "対象アプリ" : "App", selectedLabel("app")],
      [ja ? "お問い合わせ種別" : "Category", selectedLabel("category")],
      [ja ? "お名前" : "Name", val("name") || (ja ? "(未記入)" : "(not provided)")],
      [ja ? "返信先" : "Reply to", val("email")],
      [ja ? "ご利用環境" : "Environment", val("env") || (ja ? "(未記入)" : "(not provided)")]
    ];
    var head = rows.map(function (r) { return r[0] + ": " + r[1]; }).join("\n");
    return head + "\n\n----------------------------------------\n\n" + val("message") + "\n";
  }

  function say(kind, msg) {
    if (!statusEl) return;
    statusEl.className = "form-status show " + kind;
    statusEl.textContent = msg;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!form.reportValidity()) return;

    var ja = lang() === "ja";
    var subject = buildSubject();
    var body = buildBody();

    /* ページ内から直接送信（アクセスキーが設定されているとき） */
    if (WEB3FORMS_KEY) {
      submitBtn.disabled = true;
      say("ok", ja ? "送信しています…" : "Sending…");
      fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: subject,
          from_name: "R-each お問い合わせフォーム",
          botcheck: val("botcheck"),
          /* email を送ると返信先が自動でお客様のアドレスになる */
          email: val("email"),
          name: val("name"),
          message: body
        })
      })
        .then(function (res) { return res.json().catch(function () { return { success: res.ok }; }); })
        .then(function (data) {
          if (!data || !data.success) throw new Error("rejected");
          form.reset();
          applyLang();
          say("ok", ja
            ? "送信しました。5営業日以内にご返信いたします。ありがとうございます。"
            : "Sent. We'll reply within five business days — thank you.");
        })
        .catch(function () {
          say("err", ja
            ? "送信に失敗しました。お手数ですが " + TO + " まで直接お送りください。"
            : "Sending failed. Please email " + TO + " directly.");
        })
        .then(function () { submitBtn.disabled = false; });
      return;
    }

    /* メーラー起動方式 */
    var url = "mailto:" + TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    if (url.length > 1900) {
      say("err", ja
        ? "内容が長いため、メールアプリに渡せませんでした。「内容をコピー」を押して、" + TO + " 宛にお貼り付けください。"
        : "The message is too long to hand to your mail app. Use “Copy” and paste it into an email to " + TO + ".");
      return;
    }
    window.location.href = url;
    say("ok", ja
      ? "メールアプリを開きました。内容をご確認のうえ、そのまま送信してください。開かない場合は「内容をコピー」をお使いください。"
      : "Your mail app should now be open with everything filled in — just hit send. If nothing opened, use “Copy” instead.");
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var ja = lang() === "ja";
      var text = (ja ? "宛先" : "To") + ": " + TO + "\n" +
        (ja ? "件名" : "Subject") + ": " + buildSubject() + "\n\n" + buildBody();
      var done = function () {
        say("ok", ja
          ? "内容をコピーしました。" + TO + " 宛のメールに貼り付けてお送りください。"
          : "Copied. Paste it into an email to " + TO + ".");
      };
      var fail = function () {
        say("err", ja
          ? "コピーできませんでした。お手数ですが手動で選択してコピーしてください。"
          : "Copy failed. Please select and copy the text manually.");
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fail);
      } else {
        try {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.style.cssText = "position:fixed;opacity:0;";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          done();
        } catch (e) { fail(); }
      }
    });
  }
})();
