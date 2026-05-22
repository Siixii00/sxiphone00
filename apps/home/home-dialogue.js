(function (global) {
  'use strict';

  class DialogueSystem {
    constructor(container) {
      this.container = container;
      this.charDelay = 40;
      this.isActive = false;
      this._skipType = false;
      this._textNode = null;
      this._choiceHandler = null;
      this._onSkip = null;
      this._activeChoiceButtons = [];
    }

    async show(speakerName, text) {
      this.clear();
      this.isActive = true;
      this.container.classList.remove('hidden');
      this.container.innerHTML = '';

      const box = document.createElement('div');
      box.className = 'dialogue-box';
      const speaker = document.createElement('div');
      speaker.className = 'dialogue-speaker';
      speaker.textContent = speakerName || 'SYSTEM';
      const content = document.createElement('div');
      const cont = document.createElement('div');
      cont.className = 'dialogue-continue';
      cont.textContent = '▼';
      cont.style.display = 'none';

      box.appendChild(speaker);
      box.appendChild(content);
      box.appendChild(cont);
      this.container.appendChild(box);

      this._textNode = content;
      this._skipType = false;

      const skipDuringTyping = () => { this._skipType = true; };
      this._onSkip = skipDuringTyping;
      this.container.addEventListener('click', skipDuringTyping, { once: true });

      await this._typeText(text || '...');
      cont.style.display = 'block';

      return new Promise((resolve) => {
        const onContinue = () => {
          this.container.removeEventListener('click', onContinue);
          window.removeEventListener('keydown', onKeydown);
          this.clear();
          resolve();
        };
        const onKeydown = (ev) => {
          const key = ev.key.toLowerCase();
          if (key === 'enter' || key === 'z' || key === ' ') onContinue();
        };

        this.container.addEventListener('click', onContinue, { once: true });
        window.addEventListener('keydown', onKeydown);
      });
    }

    async showChoice(speakerName, text, choices) {
      this.clear();
      this.isActive = true;
      this.container.classList.remove('hidden');
      this.container.innerHTML = '';

      const box = document.createElement('div');
      box.className = 'dialogue-box';
      const speaker = document.createElement('div');
      speaker.className = 'dialogue-speaker';
      speaker.textContent = speakerName || 'SYSTEM';
      const content = document.createElement('div');
      const list = document.createElement('div');
      list.className = 'dialogue-choice-list';

      box.appendChild(speaker);
      box.appendChild(content);
      box.appendChild(list);
      this.container.appendChild(box);

      this._textNode = content;
      this._skipType = false;
      await this._typeText(text || '...');

      const safe = Array.isArray(choices) && choices.length ? choices : ['好'];
      let idx = 0;
      this._activeChoiceButtons = [];

      for (let i = 0; i < safe.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'dialogue-choice' + (i === 0 ? ' active' : '');
        btn.textContent = safe[i];
        btn.addEventListener('click', () => finalize(i));
        list.appendChild(btn);
        this._activeChoiceButtons.push(btn);
      }

      const setActive = () => {
        this._activeChoiceButtons.forEach((b, i) => b.classList.toggle('active', i === idx));
      };

      const finalize = (result) => {
        window.removeEventListener('keydown', onKey);
        this.clear();
        resolveChoice(result);
      };

      const onKey = (ev) => {
        const key = ev.key.toLowerCase();
        if (key === 'arrowup' || key === 'w') {
          idx = (idx + safe.length - 1) % safe.length;
          setActive();
        } else if (key === 'arrowdown' || key === 's') {
          idx = (idx + 1) % safe.length;
          setActive();
        } else if (key === 'enter' || key === 'z' || key === ' ') {
          finalize(idx);
        }
      };

      let resolveChoice;
      const p = new Promise((resolve) => { resolveChoice = resolve; });
      window.addEventListener('keydown', onKey);
      return p;
    }

    clear() {
      this.isActive = false;
      this._skipType = true;
      if (this.container) {
        this.container.classList.add('hidden');
        this.container.innerHTML = '';
      }
      if (this._onSkip) {
        this.container.removeEventListener('click', this._onSkip);
        this._onSkip = null;
      }
      this._activeChoiceButtons = [];
    }

    _typeText(text) {
      return new Promise((resolve) => {
        let i = 0;
        const tick = () => {
          if (!this._textNode) return resolve();
          if (this._skipType) {
            this._textNode.textContent = text;
            return resolve();
          }
          this._textNode.textContent = text.slice(0, i);
          i += 1;
          if (i <= text.length) {
            setTimeout(tick, this.charDelay);
          } else {
            resolve();
          }
        };
        tick();
      });
    }
  }

  global.DialogueSystem = DialogueSystem;
})(window);
