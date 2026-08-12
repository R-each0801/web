/* R-each contact form
 *
 * 送信方式の切り替え:
 *   FORM_ENDPOINT が空文字のあいだは「メーラー起動方式」で動作します。
 *   フォーム内容を整形した本文つきで、利用者のメールアプリが立ち上がります。
 *   （静的サイトのため、これが外部サービスなしで確実に届く唯一の方法です)
 *
 *   Formspree / Web3Forms などの無料フォームサービスに登録して
 *   エンドポイントURLをここに貼ると、ページ内から直接送信されるようになります。
 *   例: var FORM_ENDPOINT = "https://formspree.io/f/xxxxxxxx";
 */
(function () {
  "use strict";

  var FORM_ENDPOINT = "";
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
    return el ? el.value.trim() : "";
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

    if (FORM_ENDPOINT) {
      submitBtn.disabled = true;
      say("ok", ja ? "送信しています…" : "Sending…");
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          app: selectedLabel("app"),
          category: selectedLabel("category"),
          name: val("name"),
          email: val("email"),
          env: val("env"),
          message: val("message"),
          _subject: subject
        })
      })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
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
