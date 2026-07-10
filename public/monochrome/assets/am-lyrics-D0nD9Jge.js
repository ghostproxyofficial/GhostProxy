import{g as Ri}from"./_commonjsHelpers-Cpj98o6Y.js";function Fi(R,tt){for(var et=0;et<tt.length;et++){const V=tt[et];if(typeof V!="string"&&!Array.isArray(V)){for(const Q in V)if(Q!=="default"&&!(Q in R)){const rt=Object.getOwnPropertyDescriptor(V,Q);rt&&Object.defineProperty(R,Q,rt.get?rt:{enumerable:!0,get:()=>V[Q]})}}}return Object.freeze(Object.defineProperty(R,Symbol.toStringTag,{value:"Module"}))}var Le={},Ce;function zi(){if(Ce)return Le;Ce=1;function R(m,t,e,i){var s=arguments.length,n=s<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,e):i,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(m,t,e,i);else for(var a=m.length-1;a>=0;a--)(r=m[a])&&(n=(s<3?r(n):s>3?r(t,e,n):r(t,e))||n);return s>3&&n&&Object.defineProperty(t,e,n),n}typeof SuppressedError=="function"&&SuppressedError;const tt=globalThis,et=tt.ShadowRoot&&(tt.ShadyCSS===void 0||tt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,V=Symbol(),Q=new WeakMap;let rt=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==V)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(et&&t===void 0){const i=e!==void 0&&e.length===1;i&&(t=Q.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&Q.set(e,t))}return t}toString(){return this.cssText}};const We=m=>new rt(typeof m=="string"?m:m+"",void 0,V),Pe=(m,...t)=>{const e=m.length===1?m[0]:t.reduce((i,s,n)=>i+(r=>{if(r._$cssResult$===!0)return r.cssText;if(typeof r=="number")return r;throw Error("Value passed to 'css' function must be a 'css' function result: "+r+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+m[n+1],m[0]);return new rt(e,m,V)},Me=(m,t)=>{if(et)m.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const e of t){const i=document.createElement("style"),s=tt.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=e.cssText,m.appendChild(i)}},jt=et?m=>m:m=>m instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return We(e)})(m):m;const{is:_e,defineProperty:Re,getOwnPropertyDescriptor:Fe,getOwnPropertyNames:ze,getOwnPropertySymbols:De,getPrototypeOf:Oe}=Object,St=globalThis,Vt=St.trustedTypes,Ue=Vt?Vt.emptyScript:"",Ne=St.reactiveElementPolyfillSupport,pt=(m,t)=>m,Tt={toAttribute(m,t){switch(t){case Boolean:m=m?Ue:null;break;case Object:case Array:m=m==null?m:JSON.stringify(m)}return m},fromAttribute(m,t){let e=m;switch(t){case Boolean:e=m!==null;break;case Number:e=m===null?null:Number(m);break;case Object:case Array:try{e=JSON.parse(m)}catch{e=null}}return e}},It=(m,t)=>!_e(m,t),Yt={attribute:!0,type:String,converter:Tt,reflect:!1,useDefault:!1,hasChanged:It};Symbol.metadata??=Symbol("metadata"),St.litPropertyMetadata??=new WeakMap;let at=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Yt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);s!==void 0&&Re(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=Fe(this.prototype,t)??{get(){return this[e]},set(r){this[e]=r}};return{get:s,set(r){const a=s?.call(this);n?.call(this,r),this.requestUpdate(t,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Yt}static _$Ei(){if(this.hasOwnProperty(pt("elementProperties")))return;const t=Oe(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(pt("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(pt("properties"))){const e=this.properties,i=[...ze(e),...De(e)];for(const s of i)this.createProperty(s,e[s])}const t=this[Symbol.metadata];if(t!==null){const e=litPropertyMetadata.get(t);if(e!==void 0)for(const[i,s]of e)this.elementProperties.set(i,s)}this._$Eh=new Map;for(const[e,i]of this.elementProperties){const s=this._$Eu(e,i);s!==void 0&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const s of i)e.unshift(jt(s))}else t!==void 0&&e.push(jt(t));return e}static _$Eu(t,e){const i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Me(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(s!==void 0&&i.reflect===!0){const n=(i.converter?.toAttribute!==void 0?i.converter:Tt).toAttribute(e,i.type);this._$Em=t,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(s!==void 0&&this._$Em!==s){const n=i.getPropertyOptions(s),r=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:Tt;this._$Em=s;const a=r.fromAttribute(e,n.type);this[s]=a??this._$Ej?.get(s)??a,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(t!==void 0){const r=this.constructor;if(s===!1&&(n=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??It)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),n!==!0||r!==void 0)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),s===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[s,n]of this._$Ep)this[s]=n;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[s,n]of i){const{wrapped:r}=n,a=this[s];r!==!0||this._$AL.has(s)||a===void 0||this.C(s,void 0,n,a)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(e)):this._$EM()}catch(i){throw t=!1,this._$EM(),i}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};at.elementStyles=[],at.shadowRootOptions={mode:"open"},at[pt("elementProperties")]=new Map,at[pt("finalized")]=new Map,Ne?.({ReactiveElement:at}),(St.reactiveElementVersions??=[]).push("2.1.2");const Wt=globalThis,Kt=m=>m,kt=Wt.trustedTypes,Xt=kt?kt.createPolicy("lit-html",{createHTML:m=>m}):void 0,Qt="$lit$",Z=`lit$${Math.random().toFixed(9).slice(2)}$`,Zt="?"+Z,Be=`<${Zt}>`,it=document,mt=()=>it.createComment(""),gt=m=>m===null||typeof m!="object"&&typeof m!="function",Pt=Array.isArray,Ge=m=>Pt(m)||typeof m?.[Symbol.iterator]=="function",Mt=`[ 	
\f\r]`,ft=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Jt=/-->/g,te=/>/g,st=RegExp(`>|${Mt}(?:([^\\s"'>=/]+)(${Mt}*=${Mt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ee=/'/g,ie=/"/g,se=/^(?:script|style|textarea|title)$/i,ne=m=>(t,...e)=>({_$litType$:m,strings:t,values:e}),O=ne(1),re=ne(2),ot=Symbol.for("lit-noChange"),U=Symbol.for("lit-nothing"),ae=new WeakMap,nt=it.createTreeWalker(it,129);function oe(m,t){if(!Pt(m)||!m.hasOwnProperty("raw"))throw Error("invalid template strings array");return Xt!==void 0?Xt.createHTML(t):t}const qe=(m,t)=>{const e=m.length-1,i=[];let s,n=t===2?"<svg>":t===3?"<math>":"",r=ft;for(let a=0;a<e;a++){const o=m[a];let d,c,l=-1,p=0;for(;p<o.length&&(r.lastIndex=p,c=r.exec(o),c!==null);)p=r.lastIndex,r===ft?c[1]==="!--"?r=Jt:c[1]!==void 0?r=te:c[2]!==void 0?(se.test(c[2])&&(s=RegExp("</"+c[2],"g")),r=st):c[3]!==void 0&&(r=st):r===st?c[0]===">"?(r=s??ft,l=-1):c[1]===void 0?l=-2:(l=r.lastIndex-c[2].length,d=c[1],r=c[3]===void 0?st:c[3]==='"'?ie:ee):r===ie||r===ee?r=st:r===Jt||r===te?r=ft:(r=st,s=void 0);const f=r===st&&m[a+1].startsWith("/>")?" ":"";n+=r===ft?o+Be:l>=0?(i.push(d),o.slice(0,l)+Qt+o.slice(l)+Z+f):o+Z+(l===-2?a:f)}return[oe(m,n+(m[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),i]};class yt{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,r=0;const a=t.length-1,o=this.parts,[d,c]=qe(t,e);if(this.el=yt.createElement(d,i),nt.currentNode=this.el.content,e===2||e===3){const l=this.el.content.firstChild;l.replaceWith(...l.childNodes)}for(;(s=nt.nextNode())!==null&&o.length<a;){if(s.nodeType===1){if(s.hasAttributes())for(const l of s.getAttributeNames())if(l.endsWith(Qt)){const p=c[r++],f=s.getAttribute(l).split(Z),u=/([.?@])?(.*)/.exec(p);o.push({type:1,index:n,name:u[2],strings:f,ctor:u[1]==="."?je:u[1]==="?"?Ve:u[1]==="@"?Ye:Et}),s.removeAttribute(l)}else l.startsWith(Z)&&(o.push({type:6,index:n}),s.removeAttribute(l));if(se.test(s.tagName)){const l=s.textContent.split(Z),p=l.length-1;if(p>0){s.textContent=kt?kt.emptyScript:"";for(let f=0;f<p;f++)s.append(l[f],mt()),nt.nextNode(),o.push({type:2,index:++n});s.append(l[p],mt())}}}else if(s.nodeType===8)if(s.data===Zt)o.push({type:2,index:n});else{let l=-1;for(;(l=s.data.indexOf(Z,l+1))!==-1;)o.push({type:7,index:n}),l+=Z.length-1}n++}}static createElement(t,e){const i=it.createElement("template");return i.innerHTML=t,i}}function lt(m,t,e=m,i){if(t===ot)return t;let s=i!==void 0?e._$Co?.[i]:e._$Cl;const n=gt(t)?void 0:t._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),n===void 0?s=void 0:(s=new n(m),s._$AT(m,e,i)),i!==void 0?(e._$Co??=[])[i]=s:e._$Cl=s),s!==void 0&&(t=lt(m,s._$AS(m,t.values),s,i)),t}class He{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??it).importNode(e,!0);nt.currentNode=s;let n=nt.nextNode(),r=0,a=0,o=i[0];for(;o!==void 0;){if(r===o.index){let d;o.type===2?d=new bt(n,n.nextSibling,this,t):o.type===1?d=new o.ctor(n,o.name,o.strings,this,t):o.type===6&&(d=new Ke(n,this,t)),this._$AV.push(d),o=i[++a]}r!==o?.index&&(n=nt.nextNode(),r++)}return nt.currentNode=it,s}p(t){let e=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class bt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=U,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=lt(this,t,e),gt(t)?t===U||t==null||t===""?(this._$AH!==U&&this._$AR(),this._$AH=U):t!==this._$AH&&t!==ot&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Ge(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==U&&gt(this._$AH)?this._$AA.nextSibling.data=t:this.T(it.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=yt.createElement(oe(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const n=new He(s,this),r=n.u(this.options);n.p(e),this.T(r),this._$AH=n}}_$AC(t){let e=ae.get(t.strings);return e===void 0&&ae.set(t.strings,e=new yt(t)),e}k(t){Pt(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new bt(this.O(mt()),this.O(mt()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const i=Kt(t).nextSibling;Kt(t).remove(),t=i}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}}class Et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=U,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=U}_$AI(t,e=this,i,s){const n=this.strings;let r=!1;if(n===void 0)t=lt(this,t,e,0),r=!gt(t)||t!==this._$AH&&t!==ot,r&&(this._$AH=t);else{const a=t;let o,d;for(t=n[0],o=0;o<n.length-1;o++)d=lt(this,a[i+o],e,o),d===ot&&(d=this._$AH[o]),r||=!gt(d)||d!==this._$AH[o],d===U?t=U:t!==U&&(t+=(d??"")+n[o+1]),this._$AH[o]=d}r&&!s&&this.j(t)}j(t){t===U?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class je extends Et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===U?void 0:t}}class Ve extends Et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==U)}}class Ye extends Et{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=lt(this,t,e,0)??U)===ot)return;const i=this._$AH,s=t===U&&i!==U||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==U&&(i===U||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class Ke{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){lt(this,t)}}const Xe=Wt.litHtmlPolyfillSupport;Xe?.(yt,bt),(Wt.litHtmlVersions??=[]).push("3.3.2");const Qe=(m,t,e)=>{const i=e?.renderBefore??t;let s=i._$litPart$;if(s===void 0){const n=e?.renderBefore??null;i._$litPart$=s=new bt(t.insertBefore(mt(),n),n,void 0,e??{})}return s._$AI(m),s};const _t=globalThis;class vt extends at{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Qe(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return ot}}vt._$litElement$=!0,vt.finalized=!0,_t.litElementHydrateSupport?.({LitElement:vt});const Ze=_t.litElementPolyfillSupport;Ze?.({LitElement:vt}),(_t.litElementVersions??=[]).push("4.2.2");const Je={attribute:!0,type:String,converter:Tt,reflect:!1,hasChanged:It},ti=(m=Je,t,e)=>{const{kind:i,metadata:s}=e;let n=globalThis.litPropertyMetadata.get(s);if(n===void 0&&globalThis.litPropertyMetadata.set(s,n=new Map),i==="setter"&&((m=Object.create(m)).wrapped=!0),n.set(e.name,m),i==="accessor"){const{name:r}=e;return{set(a){const o=t.get.call(this);t.set.call(this,a),this.requestUpdate(r,o,m,!0,a)},init(a){return a!==void 0&&this.C(r,void 0,m,a),a}}}if(i==="setter"){const{name:r}=e;return function(a){const o=this[r];t.call(this,a),this.requestUpdate(r,o,m,!0,a)}}throw Error("Unsupported decorator location: "+i)};function B(m){return(t,e)=>typeof e=="object"?ti(m,t,e):((i,s,n)=>{const r=s.hasOwnProperty(n);return s.constructor.createProperty(n,i),r?Object.getOwnPropertyDescriptor(s,n):void 0})(m,t,e)}function J(m){return B({...m,state:!0,attribute:!1})}const ei=(m,t,e)=>(e.configurable=!0,e.enumerable=!0,Reflect.decorate&&typeof t!="object"&&Object.defineProperty(m,t,e),e);function ii(m,t){return(e,i,s)=>{const n=r=>r.renderRoot?.querySelector(m)??null;return ei(e,i,{get(){return n(this)}})}}const Y={GOOGLE:{MAX_RETRIES:3,RETRY_DELAY_MS:1e3,FETCH_TIMEOUT_MS:6e3}};class K{static delay(t){return new Promise(e=>{setTimeout(e,t)})}static fetchWithTimeout(t,e=Y.GOOGLE.FETCH_TIMEOUT_MS){const i=new AbortController,s=setTimeout(()=>i.abort(),e);return fetch(t,{signal:i.signal}).finally(()=>clearTimeout(s))}static isPurelyLatinScript(t){return/^[\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F]*$/.test(t)}static async translate(t,e){if(!t||Array.isArray(t)&&t.length===0)return Array.isArray(t)?[]:"";const i=Array.isArray(t),s=i?t:[t],n=[],r=[];if(s.forEach((u,g)=>{u&&u.trim()&&(n.push(g),r.push(u))}),r.length===0)return i?s:s[0];const a=1500,o=new Array(r.length).fill("");let d=[],c=[],l=0;const p=async(u,g)=>{if(u.length===0)return;const b=u.join(`
`);let y=0,x=!1;for(;y<Y.GOOGLE.MAX_RETRIES&&!x;)try{const S=`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${e}&dt=t&q=${encodeURIComponent(b)}`,w=await K.fetchWithTimeout(S);if(!w.ok)throw new Error(`Status ${w.status}`);const L=((await w.json())?.[0]?.map(v=>v?.[0]).join("")||"").split(`
`);g.forEach((v,E)=>{E<L.length?o[v]=L[E]:o[v]=u[E]}),x=!0}catch{y+=1,y<Y.GOOGLE.MAX_RETRIES?await K.delay(Y.GOOGLE.RETRY_DELAY_MS*2**(y-1)):g.forEach((w,P)=>{o[w]=u[P]})}};for(let u=0;u<r.length;u+=1){const g=r[u];l+g.length>a&&(await p(d,c),d=[],c=[],l=0),d.push(g),c.push(u),l+=g.length}d.length>0&&await p(d,c);const f=[...s];return n.forEach((u,g)=>{f[u]=o[g]}),i?f:f[0]}static async romanize(t){const e=Array.isArray(t)?t:t.data||t.content||[];return!e||e.length===0?Array.isArray(t)?t:[]:e.some(s=>s.isWordSynced!==!1&&Array.isArray(s.text)&&s.text.length>1)?this.romanizeWordSynced(e):this.romanizeLineSynced(e)}static async romanizeWordSynced(t){return Promise.all(t.map(async e=>{if(!e.text||!Array.isArray(e.text)||e.text.length===0||e.romanizedText)return e;const i=e.text.map(r=>r.text).join(""),[s]=await this.romanizeTexts([i]),n=e.text.map(r=>({...r,romanizedText:r.romanizedText}));return{...e,text:n,romanizedText:s||""}}))}static async romanizeLineSynced(t){const e=t.map(s=>s.romanizedText?"":Array.isArray(s.text)&&s.text.length>0?s.text.map(n=>n.text).join(""):""),i=await this.romanizeTexts(e);return t.map((s,n)=>({...s,romanizedText:i[n]||""}))}static async romanizeTexts(t){const e=t.join(" ");if(K.isPurelyLatinScript(e))return t;const i=[];for(const s of t)if(!s||K.isPurelyLatinScript(s))i.push(s);else{let n=0,r=!1,a=null;for(;n<Y.GOOGLE.MAX_RETRIES&&!r;)try{const o=`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=rm&q=${encodeURIComponent(s)}`,l=(await(await K.fetchWithTimeout(o)).json())?.[0]?.[0]?.[3]||s;i.push(l),r=!0}catch(o){a=o,console.warn(`GoogleService: Error romanizing text "${s}" (attempt ${n+1}/${Y.GOOGLE.MAX_RETRIES}):`,o),n+=1,n<Y.GOOGLE.MAX_RETRIES&&await K.delay(Y.GOOGLE.RETRY_DELAY_MS*2**(n-1))}r||(console.error(`GoogleService: Failed to romanize text "${s}" after ${Y.GOOGLE.MAX_RETRIES} attempts. Last error:`,a),i.push(s))}return i}}const le="1.5.5",xt=7e3,si=8e3,ni=500,ce=350,Rt=4e3,ct=Rt*2,dt=600,ri=.85,ai=180,oi=80,li=240,ci=.75,di=.45,hi=.35,ui=760,pi=1320,de=120;function X(m,t={},e=si){const i=new AbortController,s=setTimeout(()=>i.abort(),e);return fetch(m,{...t,signal:i.signal}).finally(()=>clearTimeout(s))}const he=["https://lyricsplus.binimum.org","https://lyricsplus-seven.vercel.app","https://lyricsplus.prjktla.workers.dev","https://lyrics-plus-backend.vercel.app"],ue="apple,lyricsplus,musixmatch,spotify,qq,deezer,musixmatch-word",mi="https://fetch-genius.samidy.workers.dev/";class h extends vt{constructor(){super(...arguments),this.downloadFormat="auto",this.highlightColor="#ffffff",this.autoScroll=!0,this.interpolate=!0,this.showRomanization=!1,this.showTranslation=!1,this._currentTime=0,this.isLoading=!1,this.activeLineIndices=[],this.activeMainWordIndices=new Map,this.activeBackgroundWordIndices=new Map,this.mainWordProgress=new Map,this.backgroundWordProgress=new Map,this.lyricsSource=null,this.availableSources=[],this.currentSourceIndex=0,this.isFetchingAlternatives=!1,this.hasFetchedAllProviders=!1,this.mainWordAnimations=new Map,this.backgroundWordAnimations=new Map,this.lastInstrumentalIndex=null,this.isUserScrolling=!1,this.isProgrammaticScroll=!1,this.isClickSeeking=!1,this.cachedLyricsLines=[],this.cachedLineArray=[],this.lineElementCache=new Map,this.gapElementCache=new Map,this.cachedAllGaps=[],this.cachedIsUnsynced=!1,this.cachedLineData=null,this.activeLineIds=new Set,this.currentPrimaryActiveLine=null,this.lastPrimaryActiveLine=null,this.backgroundExpandedLine=null,this.scrollAnimationState=null,this.currentScrollOffset=0,this.animatingLines=[],this.lastActiveIndex=0,this.visibleLineIds=new Set,this.cachedScrollPaddingTop=null,this.preActiveLineElements=[],this.positionedLineElements=[],this.activeGapLineElements=[],this._boundHandleUserScroll=this.handleUserScroll.bind(this),this._boundAnimateProgress=this.animateProgress.bind(this)}async toggleRomanization(){this.showRomanization=!this.showRomanization,await this.applyRomanization()}async applyRomanization(){if(this.showRomanization&&this.lyrics&&this.lyrics.some(e=>!e.romanizedText&&(!e.text||!e.text.some(i=>i.romanizedText)))){this.isLoading=!0;try{const e=await K.romanize(this.lyrics);this.lyrics=e}catch(e){console.error("Romanization failed",e)}finally{this.isLoading=!1}}}async toggleTranslation(){this.showTranslation=!this.showTranslation,await this.applyTranslation()}async applyTranslation(){if(this.showTranslation&&this.lyrics&&this.lyrics.some(e=>!e.translation)){this.isLoading=!0;try{const e=this.lyrics.map(r=>r.translation?"":r.text.map(a=>a.text).join(""));if(e.every(r=>!r)){this.isLoading=!1;return}const i=await K.translate(e,"en"),s=Array.isArray(i)?i:[i],n=this.lyrics.map((r,a)=>r.translation?r:{...r,translation:s[a]||void 0});this.lyrics=n}catch(e){console.error("Translation failed",e)}finally{this.isLoading=!1}}}set currentTime(t){const e=this._currentTime;t<e&&e-t>1e3&&this.lyrics&&(this.activeLineIndices=[],this.activeMainWordIndices.clear(),this.activeBackgroundWordIndices.clear(),this.mainWordProgress.clear(),this.backgroundWordProgress.clear(),this.mainWordAnimations.clear(),this.backgroundWordAnimations.clear(),this.preActiveLineElements=[],this.positionedLineElements=[],this.activeGapLineElements=[],this.clearBackgroundExpandedLine(),this.lyricsContainer&&(this.lyricsContainer.querySelectorAll(".lyrics-line.active, .lyrics-line.pre-active, .lyrics-line.bg-expanded").forEach(n=>{n.classList.remove("active","pre-active","bg-expanded"),h.resetSyllables(n)}),this.lyricsContainer.querySelectorAll(".lyrics-gap.active, .lyrics-gap.gap-exiting").forEach(n=>n.classList.remove("active","gap-exiting")),this.gapElementCache.clear())),this._currentTime=t,e!==t&&this.lyrics&&this._onTimeChanged(e,t)}get currentTime(){return this._currentTime}_updateFooter(){const t=this.shadowRoot?.querySelector(".lyrics-footer");if(!t)return;const e=t.querySelector(".source-switch-btn"),i=t.querySelector(".source-switch-svg"),s=t.querySelector(".source-switch-label");e&&(e.disabled=this.isFetchingAlternatives),i&&i.classList.toggle("is-loading",this.isFetchingAlternatives),s&&(s.textContent=this.isFetchingAlternatives?"Switching...":"Switch")}connectedCallback(){super.connectedCallback(),this.fetchLyrics()}disconnectedCallback(){super.disconnectedCallback(),this.animationFrameId&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=void 0),this.userScrollTimeoutId&&(clearTimeout(this.userScrollTimeoutId),this.userScrollTimeoutId=void 0),this.clickSeekTimeout&&(clearTimeout(this.clickSeekTimeout),this.clickSeekTimeout=void 0),this.scrollAnimationTimeout&&(clearTimeout(this.scrollAnimationTimeout),this.scrollAnimationTimeout=void 0),this.scrollUnlockTimeout&&(clearTimeout(this.scrollUnlockTimeout),this.scrollUnlockTimeout=void 0),this.fetchAbortController?.abort(),this.fetchAbortController=void 0,this.lyricsContainer&&(this.lyricsContainer.removeEventListener("wheel",this._boundHandleUserScroll),this.lyricsContainer.removeEventListener("touchmove",this._boundHandleUserScroll)),this.preActiveLineElements=[],this.positionedLineElements=[],this.activeGapLineElements=[],this.visibilityObserver?.disconnect(),this.visibilityObserver=void 0}async fetchLyrics(){this.fetchAbortController?.abort();const t=new AbortController;this.fetchAbortController=t,this.isLoading=!0,this.lyrics=void 0,this.lyricsSource=null,this.availableSources=[],this.currentSourceIndex=0,this.isFetchingAlternatives=!1,this.hasFetchedAllProviders=!1,this._updateFooter();try{if(this.ttml){const r=h.parseTTML(this.ttml);if(r&&r.lines.length>0){this.lyrics=r.lines,this.lyricsSource="Local",r.songwriters&&(this.songwriters=r.songwriters),this.availableSources=[{lines:this.lyrics,source:"Local",songwriters:this.songwriters}],this.currentSourceIndex=0,this.hasFetchedAllProviders=!0,this._updateFooter(),await this.onLyricsLoaded();return}}const e=await this.resolveSongMetadata();if(t.signal.aborted)return;const i=!!this.musicId&&!this.songTitle&&!this.songArtist&&!this.query&&!this.isrc,s=[];if(e?.metadata&&!i){const r=e.metadata.title?.trim()||"",a=e.metadata.artist?.trim()||"",o=await h.fetchLyricsFromBiniLyrics(r,a,e.catalogIsrc,e.metadata);o&&o.lines.length>0&&s.push(o);const d=c=>c.some(l=>l.lines.some(p=>p.isWordSynced||p.text&&p.text.length>1));if(s.length===0||!d(s)){const c=await h.fetchLyricsFromUnison(e.metadata);c&&c.lines.length>0&&s.push(c)}if(s.length===0||!d(s)){const c=await h.fetchLyricsFromYouLyPlus(r,a,e.catalogIsrc,e.metadata,!0);c&&c.length>0&&s.push(...c)}}const n=r=>r.some(a=>a.lines.some(o=>o.timestamp>0||o.endtime>0));if((s.length===0||!n(s))&&e?.metadata){const r=await h.fetchLyricsFromLrclib(e.metadata);r&&r.lines.length>0&&s.push({lines:r.lines,source:"LRCLIB"})}if(s.length===0&&e?.metadata){const r=await h.fetchLyricsFromGenius(e.metadata);r&&r.lines.length>0&&s.push({lines:r.lines,source:"Genius"})}if(this.hasFetchedAllProviders=s.length===0||s.some(r=>r.source==="LRCLIB"||r.source==="Genius"),this._updateFooter(),s.length>0){this.availableSources=h.mergeAndSortSources(s),this.currentSourceIndex=0;const r=this.availableSources[0];this.lyrics=r.lines,this.lyricsSource=r.source,r.songwriters&&(this.songwriters=r.songwriters),await this.onLyricsLoaded();return}this.lyrics=void 0,this.lyricsSource=null}finally{t.signal.aborted||(this.isLoading=!1)}}async onLyricsLoaded(){this.activeLineIndices=[],this.activeMainWordIndices.clear(),this.activeBackgroundWordIndices.clear(),this.mainWordProgress.clear(),this.backgroundWordProgress.clear(),this.mainWordAnimations.clear(),this.backgroundWordAnimations.clear(),this.preActiveLineElements=[],this.positionedLineElements=[],this.activeGapLineElements=[],this.clearBackgroundExpandedLine(),this.lyricsContainer&&(this.isProgrammaticScroll=!0,this.lyricsContainer.scrollTop=0,window.setTimeout(()=>{this.isProgrammaticScroll=!1},100)),await this.autoProcessLyrics()}async autoProcessLyrics(){this.showRomanization&&await this.applyRomanization(),this.showTranslation&&await this.applyTranslation()}static getRankForCollected(t,e){const i=t.toLowerCase(),s=e.some(a=>a.text&&Array.isArray(a.text)&&a.text.length>1),n=e.length>0&&e.every(a=>a.timestamp===0&&a.endtime===0),r=i.includes("qq")||i.includes("lyricsplus");return i.includes("apple")&&s?1:i.includes("bini")&&s?2:i.includes("unison")&&s?3:r&&s?4:i.includes("musixmatch")&&s?5:i.includes("lrclib")&&s?6:s?7:i.includes("apple")&&!s&&!n?8:i.includes("bini")&&!s&&!n?9:i.includes("unison")&&!s&&!n?10:r&&!s&&!n?11:i.includes("musixmatch")&&!s&&!n?12:i.includes("lrclib")&&!s&&!n?13:!s&&!n?14:i.includes("apple")&&n?15:i.includes("bini")&&n?16:i.includes("unison")&&n?17:r&&n?18:i.includes("musixmatch")&&n?19:i.includes("lrclib")&&n?20:i.includes("genius")?21:30}static getDisplaySourceLabel(t){return t.toLowerCase().includes("lyricsplus")?"QQ":t}static getSourceKey(t){const e=(t||"").trim().toLowerCase();return e?e.includes("lyricsplus")||e==="qq"?"qq":e.replace(/\s+/g," "):""}static mergeAndSortSources(t){const e=new Map;for(const i of t){const s=h.getDisplaySourceLabel(i.source);e.has(s)||e.set(s,{...i,source:s})}return Array.from(e.values()).sort((i,s)=>h.getRankForCollected(i.source,i.lines)-h.getRankForCollected(s.source,s.lines))}findCurrentSourceIndex(t=this.availableSources,e=this.lyricsSource,i=this.lyrics){const s=t.findIndex(r=>r.lines===i);if(s!==-1)return s;const n=h.getSourceKey(e);return n?t.findIndex(r=>h.getSourceKey(r.source)===n):-1}static getNextSourceIndex(t,e,i,s){if(t.length<=1)return-1;if(e!==-1)return(e+1)%t.length;const n=h.getSourceKey(i),r=t.findIndex(a=>a.lines!==s&&h.getSourceKey(a.source)!==n);return r===-1?0:r}async applySourceAtIndex(t){const e=this.availableSources[t];e&&(this.currentSourceIndex=t,this.lyrics=e.lines,this.lyricsSource=e.source,e.songwriters&&(this.songwriters=e.songwriters),await this.onLyricsLoaded())}async switchSource(){if(this.isFetchingAlternatives)return;const t=this.lyricsSource,e=this.lyrics;if(!this.hasFetchedAllProviders){this.isFetchingAlternatives=!0,this._updateFooter();try{const i=await this.resolveSongMetadata();if(i?.metadata){const s=[];if(!this.availableSources.some(n=>n.source.toLowerCase().includes("unison"))){const n=await h.fetchLyricsFromUnison(i.metadata);n&&n.lines.length>0&&s.push(n)}if(!this.availableSources.some(n=>n.source.toLowerCase().includes("apple")||n.source.toLowerCase().includes("qq"))){const n=i.metadata.title?.trim()||"",r=i.metadata.artist?.trim()||"",a=await h.fetchLyricsFromYouLyPlus(n,r,i.catalogIsrc,i.metadata,!0);a&&a.length>0&&s.push(...a)}if(!this.availableSources.some(n=>n.source.toLowerCase().includes("lrclib"))){const n=await h.fetchLyricsFromLrclib(i.metadata);n&&n.lines.length>0&&s.push({lines:n.lines,source:"LRCLIB"})}if(!this.availableSources.some(n=>n.source.toLowerCase().includes("genius"))){const n=await h.fetchLyricsFromGenius(i.metadata);n&&n.lines.length>0&&s.push({lines:n.lines,source:"Genius"})}s.length>0&&(this.availableSources=h.mergeAndSortSources([...this.availableSources,...s]),this.currentSourceIndex=this.findCurrentSourceIndex(this.availableSources,t,e))}}finally{this.hasFetchedAllProviders=!0,this.isFetchingAlternatives=!1,this._updateFooter()}}if(this.availableSources.length>1){const i=this.findCurrentSourceIndex(this.availableSources,t,e),s=h.getNextSourceIndex(this.availableSources,i,t,e);s!==-1&&await this.applySourceAtIndex(s)}}async resolveSongMetadata(){const t={title:this.songTitle?.trim()??"",artist:this.songArtist?.trim()??"",album:this.songAlbum?.trim()||void 0,songwriters:this.songwriters?.trim()||void 0,durationMs:void 0};typeof this.songDurationMs=="number"&&this.songDurationMs>0?t.durationMs=this.songDurationMs:typeof this.duration=="number"&&this.duration>0&&(t.durationMs=this.duration);const e=null;let i=this.musicId,s=this.isrc;if(this.query&&(!t.title||!t.artist||!t.album)){const l=h.parseQueryMetadata(this.query);l&&(!t.title&&l.title&&(t.title=l.title),!t.artist&&l.artist&&(t.artist=l.artist),!t.album&&l.album&&(t.album=l.album))}let n=null;this.query&&(!t.title||!t.artist)&&(n=await h.searchLyricsPlusCatalog(this.query),n&&(!t.title&&n.title&&(t.title=n.title),!t.artist&&n.artist&&(t.artist=n.artist),!t.album&&n.album&&(t.album=n.album),!t.songwriters&&n.songwriters&&(t.songwriters=n.songwriters),t.durationMs==null&&typeof n.durationMs=="number"&&n.durationMs>0&&(t.durationMs=n.durationMs),!i&&n.id?.appleMusic&&(i=n.id.appleMusic),!s&&n.isrc&&(s=n.isrc)));const r=t.title?.trim()??"",a=t.artist?.trim()??"",o=t.album?.trim(),d=typeof t.durationMs=="number"&&Number.isFinite(t.durationMs)&&t.durationMs>0?Math.round(t.durationMs):void 0;return{metadata:r&&a?{title:r,artist:a,album:o||void 0,durationMs:d}:void 0,appleId:i,appleSong:e,catalogIsrc:s}}static parseQueryMetadata(t){const e=t?.trim();if(!e)return null;const i={},s=e.split(/\s[-–—]\s/);if(s.length>=2){const[r,...a]=s,o=a.join(" - "),d=r.trim(),c=o.trim();if(d&&c)return i.title=d,i.artist=c,i}const n=e.split(/\s+[bB]y\s+/);if(n.length===2){const[r,a]=n.map(o=>o.trim());if(r&&a)return i.title=r,i.artist=a,i}return null}static async searchLyricsPlusCatalog(t){const e=t?.trim();if(!e)return null;for(const i of he){const n=`${i.endsWith("/")?i.slice(0,-1):i}/v1/songlist/search?q=${encodeURIComponent(e)}`;try{const r=await X(n);if(r.ok){const a=await r.json();let o=[];const d=a;if(Array.isArray(d?.results)?o=d.results:Array.isArray(a)&&(o=a),o.length>0)return o.find(l=>l?.id&&l.id.appleMusic)??o[0]}}catch{}}return null}static async fetchLyricsFromBiniLyrics(t,e,i,s={}){if((!t||!e)&&!i)return null;try{let n=null;if(i)try{const r=`https://lyrics-api.binimum.org/?isrc=${encodeURIComponent(i)}`,a=await X(r);if(a.ok){const o=await a.json();o.results&&o.results.length>0&&(n=o)}}catch{}if(!n&&t&&e){const r=new URLSearchParams({track:t,artist:e});s.album&&r.append("album",s.album),s.durationMs&&s.durationMs>0&&r.append("duration",Math.round(s.durationMs/1e3).toString());const a=`https://lyrics-api.binimum.org/?${r.toString()}`,o=await X(a);o.ok&&(n=await o.json())}if(n&&n.results&&n.results.length>0){const r=n.results[0];if(r.lyricsUrl){const a=await X(r.lyricsUrl);if(a.ok){const o=await a.text(),d=h.parseTTML(o);if(d&&d.lines.length>0)return{lines:d.lines,source:"BiniLyrics",songwriters:d.songwriters}}}}}catch(n){console.error("Cache API failed",n)}return null}static async fetchLyricsFromYouLyPlus(t,e,i,s={},n=!1){if((!t||!e)&&!i)return[];const r=new URLSearchParams;t&&r.append("title",t),e&&r.append("artist",e),i&&r.append("isrc",i),s.album&&r.append("album",s.album),s.durationMs&&s.durationMs>0&&r.append("duration",Math.round(s.durationMs/1e3).toString()),ue.includes("apple")||r.append("source",ue);const a=(l,p)=>{const f=l.toLowerCase(),u=p.some(y=>y.text&&Array.isArray(y.text)&&y.text.length>1),g=p.length>0&&p.every(y=>y.timestamp===0&&y.endtime===0),b=f.includes("qq")||f.includes("lyricsplus");return f.includes("apple")&&u?1:f.includes("bini")&&u?2:f.includes("unison")&&u?3:b&&u?4:f.includes("musixmatch")&&u?5:u?6:f.includes("apple")&&!u&&!g?7:f.includes("bini")&&!u&&!g?8:f.includes("unison")&&!u&&!g?9:b&&!u&&!g?10:f.includes("musixmatch")&&!u&&!g?11:!u&&!g?12:f.includes("apple")&&g?13:f.includes("bini")&&g?14:f.includes("unison")&&g?15:b&&g?16:f.includes("musixmatch")&&g?17:30},o=[];if(!n){const l=await h.fetchLyricsFromBiniLyrics(t,e,i,s);if(l)return o.push(l),o}const d=[...he].sort(()=>Math.random()-.5).slice(0,3);for(const l of d){const f=`${l.endsWith("/")?l.slice(0,-1):l}/v2/lyrics/get?${r.toString()}`;let u=null;try{const g=await X(f);g.ok&&(u=await g.json())}catch{u=null}if(u){const g=h.convertKPoeLyrics(u);if(g&&g.length>0){const b=u?.metadata?.source||u?.metadata?.provider||"LyricsPlus (KPoe)",y=a(b,g),x={lines:g,source:b};if(o.push(x),y===1)break}}}if(!o.some(l=>a(l.source,l.lines)<=2))try{const p=`https://lyricsplus.binimum.org/v2/lyrics/get?${new URLSearchParams(r).toString()}`,f=await X(p);if(f.ok){const u=await f.json();if(u){const g=h.convertKPoeLyrics(u),b=u?.metadata?.source||u?.metadata?.provider||"LyricsPlus (KPoe)",y=g?.some(x=>x.text&&Array.isArray(x.text)&&x.text.length>1);g&&g.length>0&&y&&o.push({lines:g,source:b})}}}catch{}return o}static parseLrcSubtitles(t){if(!t||typeof t!="string")return[];const e=[],i=t.split(`
`),s=[];for(const n of i){const r=n.match(/^\[(\d{1,3}):(\d{2})\.(\d{2,3})\]\s?(.*)$/);if(!r)continue;const a=parseInt(r[1],10),o=parseInt(r[2],10);let d=parseInt(r[3],10);r[3].length===3&&(d=Math.round(d/10));const c=(a*60+o)*1e3+d*10,l=r[4]||"";s.push({timestamp:c,text:l})}for(let n=0;n<s.length;n+=1){const{timestamp:r,text:a}=s[n],o=n+1<s.length?s[n+1].timestamp:r+5e3;if(!a.trim())continue;const d={text:a,part:!1,timestamp:r,endtime:o,lineSynced:!0};e.push({text:[d],background:!1,backgroundText:[],oppositeTurn:!1,timestamp:r,endtime:o,isWordSynced:!1})}return e}static async fetchLyricsFromLrclib(t){const e=t.title?.trim(),i=t.artist?.trim();if(!e||!i)return null;try{const s=`${i} ${e}`,n=new URLSearchParams({q:s}),r=await X(`https://lrclib.net/api/search?${n.toString()}`,{headers:{"User-Agent":`apple-music-web-components/${le}`}});if(!r.ok)return null;const a=await r.json();if(!Array.isArray(a)||a.length===0)return null;const d=a.find(c=>c.syncedLyrics&&typeof c.syncedLyrics=="string")||a[0];if(d.syncedLyrics){const c=h.parseLrcSubtitles(d.syncedLyrics);if(c.length>0)return{lines:c,source:"LRCLIB"}}if(d.plainLyrics&&typeof d.plainLyrics=="string"){const c=d.plainLyrics.split(`
`).filter(l=>l.trim());if(c.length>0)return{lines:c.map(p=>({text:[{text:p,part:!1,timestamp:0,endtime:0}],background:!1,backgroundText:[],oppositeTurn:!1,timestamp:0,endtime:0,isWordSynced:!1})),source:"LRCLIB (unsynced)"}}}catch{}return null}static async fetchLyricsFromGenius(t){const e=t.title?.trim(),i=t.artist?.trim();if(!e||!i)return null;try{const s=new URLSearchParams({title:e,artist:i}),n=await X(`${mi}?${s.toString()}`);if(!n.ok)return null;const r=await n.json();if(r.lyrics){const a=r.lyrics.split(`
`).map(o=>o.trim()).filter(o=>o&&!o.startsWith("["));if(a.length>0)return{lines:a.map(d=>({text:[{text:d,part:!1,timestamp:0,endtime:0}],background:!1,backgroundText:[],oppositeTurn:!1,timestamp:0,endtime:0,isWordSynced:!1})),source:"Genius"}}}catch{}return null}static async fetchLyricsFromUnison(t){const e=t.title?.trim(),i=t.artist?.trim();if(!e||!i)return null;const s=new URLSearchParams;s.append("song",e),s.append("artist",i),t.album&&s.append("album",t.album),t.durationMs&&t.durationMs>0&&s.append("duration",Math.round(t.durationMs/1e3).toString());try{const n=await X(`https://unison.boidu.dev/lyrics?${s.toString()}`);if(!n.ok)return null;const r=await n.json();if(!r.success||!r.data?.lyrics)return null;const a=r.data,o=a.format||"lrc",d=a.syncType||"linesync",c=a.lyrics;if(o==="ttml"){const l=h.parseTTML(c);if(l&&l.lines.length>0)return{lines:l.lines,source:"Unison",songwriters:l.songwriters}}if(o==="lrc")if(d==="plain"){const l=c.split(`
`).map(p=>p.trim()).filter(p=>p);if(l.length>0)return{lines:l.map(f=>({text:[{text:f,part:!1,timestamp:0,endtime:0}],background:!1,backgroundText:[],oppositeTurn:!1,timestamp:0,endtime:0,isWordSynced:!1})),source:"Unison (unsynced)"}}else{const l=h.parseLrcSubtitles(c);if(l.length>0)return{lines:l,source:"Unison"}}}catch{}return null}static calculateLineAlignments(t,e){const i=new Array(t.length).fill(void 0);let s=!0,n=null,r=0,a=0;if(t.forEach((o,d)=>{let c;if(o){let l=e[o];l||(o==="v1000"?l="group":o==="v2000"?l="other":l="person"),l==="group"?c="start":(n===null?l==="other"?s=!1:s=!0:o!==n&&(s=!s),c=s?"start":"end",n=o)}c&&(a+=1,c==="end"&&(r+=1)),i[d]=c}),a>0&&Math.round(r/a*100)>=85){const o=d=>d==="start"?"end":d==="end"?"start":d;for(let d=0;d<i.length;d+=1)i[d]=o(i[d])}return i}static parseTTML(t){try{const i=new DOMParser().parseFromString(t,"text/xml"),s={},n={},r={},a=i.getElementsByTagName("ttm:agent");for(let y=0;y<a.length;y+=1){const x=a[y],S=x.getAttribute("xml:id"),w=x.getAttribute("type");S&&w&&(r[S]=w)}let o;const d=i.getElementsByTagName("songwriter");if(d.length>0){const y=[];for(let x=0;x<d.length;x+=1)d[x].textContent&&y.push(d[x].textContent);y.length>0&&(o=y.join(", "))}const c=i.getElementsByTagName("translation");for(let y=0;y<c.length;y+=1){const x=c[y].getElementsByTagName("text");for(let S=0;S<x.length;S+=1){const w=x[S],P=w.getAttribute("for");P&&w.textContent&&(s[P]=w.textContent)}}const l=y=>{if(!y)return 0;const x=y.split(":");let S=0;return x.length===2?S=parseInt(x[0],10)*60+parseFloat(x[1]):x.length===3?S=parseInt(x[0],10)*3600+parseInt(x[1],10)*60+parseFloat(x[2]):S=parseFloat(x[0]),Math.round(S*1e3)},p=i.getElementsByTagName("transliteration");for(let y=0;y<p.length;y+=1){const x=p[y].getElementsByTagName("text");for(let S=0;S<x.length;S+=1){const w=x[S],P=w.getAttribute("for");if(!P)continue;const F=Array.from(w.getElementsByTagName("span")).filter(L=>L.getAttribute("begin"));if(F.length>0){const L=[];let v="";for(let E=0;E<F.length;E+=1){const T=F[E],k=T.getAttribute("begin"),_=T.getAttribute("end");let $=T.textContent||"";const C=T.nextSibling;C&&C.nodeType===3&&/^\s/.test(C.textContent||"")&&!$.endsWith(" ")&&($+=" "),$.trim()!==""&&(L.push({time:l(k),duration:l(_)-l(k),text:$}),v+=$)}n[P]={text:v.trim(),syllabus:L}}else w.textContent&&(n[P]={text:w.textContent.trim().replace(/\s+/g," ")})}}const f=[],u=i.getElementsByTagName("p"),g=[];for(let y=0;y<u.length;y+=1)g.push(u[y].getAttribute("ttm:agent")||void 0);const b=h.calculateLineAlignments(g,r);for(let y=0;y<u.length;y+=1){const x=u[y],S=x.getAttribute("itunes:key"),w=l(x.getAttribute("begin")),P=l(x.getAttribute("end"));let F;x.parentNode&&x.parentNode.tagName==="div"&&(F=x.parentNode.getAttribute("itunes:songPart")||void 0);const L=[],v=[],E=x.getElementsByTagName("span");if(E.length>0)for(let _=0;_<E.length;_+=1){const $=E[_];if($.getAttribute("ttm:role")==="x-bg"){const A=$.getElementsByTagName("span");for(let I=0;I<A.length;I+=1){const z=A[I];let W=z.textContent||"";const D=z.nextSibling;D&&D.nodeType===3&&/^\s/.test(D.textContent||"")&&!W.endsWith(" ")&&(W+=" "),v.push({text:W,timestamp:l(z.getAttribute("begin")),endtime:l(z.getAttribute("end")),part:!/\s$/.test(W)})}continue}if($.parentNode&&$.parentNode.getAttribute?.("ttm:role")==="x-bg")continue;let C=$.textContent||"";const M=$.nextSibling;M&&M.nodeType===3&&/^\s/.test(M.textContent||"")&&!C.endsWith(" ")&&(C+=" "),L.push({text:C,timestamp:l($.getAttribute("begin")),endtime:l($.getAttribute("end")),part:!/\s$/.test(C)})}else L.push({text:x.textContent?.trim()||"",timestamp:w,endtime:P,part:!1,lineSynced:!0});const T=b[y],k=S?n[S]:void 0;if(k&&L.length>1&&E.length>0)if(k.syllabus&&k.syllabus.length===L.length)L.forEach((_,$)=>{_.romanizedText=k.syllabus[$].text});else{const $=k.text.split(/\s+/).filter(Boolean),C=[];for(let A=0;A<L.length;A+=1)L[A].part&&C.length>0?C[C.length-1].push(A):C.push([A]);const M=/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(L.map(A=>A.text).join(""));if($.length===C.length)C.forEach((A,I)=>{L[A[0]].romanizedText=$[I]});else if($.length===L.length)L.forEach((A,I)=>{A.romanizedText=$[I]});else if(M){let A=0;for(const I of C){const z=L[I[0]],q=(I.map(j=>L[j].text).join("").match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7afA-Za-z0-9]/g)||[]).length;q>0&&A<$.length&&(z.romanizedText=$.slice(A,A+q).join(" "),A+=q)}}}f.push({text:L,background:v.length>0,backgroundText:v,timestamp:w,endtime:P,isWordSynced:E.length>0,alignment:T,songPart:F,translation:S?s[S]:void 0,romanizedText:k?.text,oppositeTurn:T==="end"})}return{lines:f,songwriters:o}}catch(e){return console.error("Failed to parse TTML",e),null}}static convertKPoeLyrics(t){if(!t)return null;let e=null;if(Array.isArray(t?.lyrics)?e=t.lyrics:Array.isArray(t?.data?.lyrics)?e=t.data.lyrics:Array.isArray(t?.data)&&(e=t.data),!e||e.length===0)return null;const i=e.filter(d=>!!d),s=[],n=t.type==="Line"||t.type==="line",r={};t.metadata?.agents&&Object.entries(t.metadata.agents).forEach(([d,c])=>{const l=c.alias||d;r[l]=c.type});const a=i.map(d=>d.element?.singer),o=h.calculateLineAlignments(a,r);for(let d=0;d<i.length;d+=1){const c=i[d],l=h.toMilliseconds(c.time),p=h.toMilliseconds(c.duration),f=o[d],u=typeof c.text=="string"?c.text:"",g=h.toMilliseconds(c.time),b=h.toMilliseconds(c.duration),x=h.toMilliseconds(c.endTime)||g+(b||0);let S=[];Array.isArray(c.syllabus)?S=c.syllabus.filter(k=>!!k):Array.isArray(c.words)&&(S=c.words.filter(k=>!!k));const w=[],P=[];if(!n&&S.length>0)for(const k of S){const _=h.toMilliseconds(k.time,g),$=h.toMilliseconds(k.duration),C=$===0&&S.length===1?x:_+$,M={text:typeof k.text=="string"?k.text:"",part:!!k.part,timestamp:_,endtime:C};k.isBackground?P.push(M):w.push(M)}w.length===0&&u&&w.push({text:u,part:!1,timestamp:g,endtime:x||g,lineSynced:n});const F=w.length>0||P.length>0,{transliteration:L}=c;let v;L&&(v=L.text,Array.isArray(L.syllabus)&&L.syllabus.length===w.length&&L.syllabus.forEach((k,_)=>{w[_].romanizedText=k.text}));const E=c.translation?.text,T={text:w,background:P.length>0,backgroundText:P,oppositeTurn:f==="end"||(Array.isArray(c.element)?c.element.includes("opposite")||c.element.includes("right"):!1),timestamp:g,endtime:l+p,isWordSynced:n?!1:F,alignment:f,songPart:c.element?.songPart,romanizedText:v,translation:E};s.push(T)}return s}static toMilliseconds(t,e=0){const i=Number(t);return!Number.isFinite(i)||Number.isNaN(i)?e:Number.isInteger(i)?Math.max(0,Math.round(i)):Math.round(i*1e3)}firstUpdated(){this.lyricsContainer&&(this.lyricsContainer.addEventListener("wheel",this._boundHandleUserScroll,{passive:!0}),this.lyricsContainer.addEventListener("touchmove",this._boundHandleUserScroll,{passive:!0}))}_onTimeChanged(t,e){const s=Math.abs(e-t)>ni,n=this.findActiveLineIndices(e),r=this.activeLineIndices;if(!h.arraysEqual(n,r)||s){if(this.lyricsContainer){for(const o of r)if(!n.includes(o)){const d=this._getLineElement(o);if(d){s||this.isUserScrolling||h.isLineSyncedLine(this.lyrics?.[o])?h.unfinishSyllables(d):h.finishSyllablesUpToTime(d,e),d.classList.remove("active","bg-expanded"),d.classList.contains("pre-active")&&d.classList.remove("pre-active");const c=this.preActiveLineElements.indexOf(d);c!==-1&&this.preActiveLineElements.splice(c,1)}}for(const o of n)if(!r.includes(o)){const d=this._getLineElement(o);if(d){d.classList.add("active"),d.classList.remove("pre-active");const c=this.preActiveLineElements.indexOf(d);c!==-1&&this.preActiveLineElements.splice(c,1)}}for(const o of this.preActiveLineElements){const d=h.getLineIndexFromElement(o);(d===null||!n.includes(d)&&o!==this.currentPrimaryActiveLine)&&o.classList.remove("pre-active")}this.preActiveLineElements=this.preActiveLineElements.filter(o=>o.classList.contains("pre-active"))}this.startAnimationFromTime(e)}if(this._handleActiveLineScroll(r,s),this.clearPastLineHighlights(),this.lyricsContainer){for(const l of this.activeLineIndices){const p=this._getLineElement(l);p&&h.updateSyllablesForLine(p,e)}for(const l of this.activeGapLineElements)h.updateSyllablesForLine(l,e);if(this.gapElementCache.size>0)for(const[,l]of this.gapElementCache){const p=l._cachedStartTime??parseFloat(l.getAttribute("data-start-time")||"0"),f=l._cachedEndTime??parseFloat(l.getAttribute("data-end-time")||"0"),u=e>=p&&e<f,g=l.classList.contains("active"),b=l.classList.contains("gap-exiting"),y=dt,x=g&&!b&&e>=f-y;if(u&&(!g||s)&&!b){l.classList.remove("gap-exiting"),s&&g&&(l.classList.remove("active"),l.offsetWidth);const S=f-p,P=h.getGapLoopDelay(S)+(e-p);l.style.setProperty("--gap-loop-delay",`-${P}ms`),l.classList.add("active"),this.activeGapLineElements.includes(l)||this.activeGapLineElements.push(l),l.querySelectorAll(".lyrics-syllable").forEach(L=>{const v=parseFloat(L.getAttribute("data-start-time")||"0"),E=parseFloat(L.getAttribute("data-end-time")||"0");e>E?(L.classList.add("finished"),L.classList.contains("highlight")||h.updateSyllableAnimation(L,e-v)):e>=v&&e<=E&&h.updateSyllableAnimation(L,e-v)})}else if(x){l.classList.remove("active"),l.offsetWidth,l.classList.add("gap-exiting");const S=this.activeGapLineElements.indexOf(l);S!==-1&&this.activeGapLineElements.splice(S,1),setTimeout(()=>{l.classList.remove("gap-exiting")},dt)}else if(!u&&(g||b)){l.classList.remove("active"),l.classList.remove("gap-exiting");const S=this.activeGapLineElements.indexOf(l);S!==-1&&this.activeGapLineElements.splice(S,1)}else b&&e<f-y&&l.classList.remove("gap-exiting")}else this.lyricsContainer&&this.lyricsContainer.querySelectorAll(".lyrics-gap").forEach(p=>{const f=parseFloat(p.getAttribute("data-start-time")||"0"),u=parseFloat(p.getAttribute("data-end-time")||"0"),g=e>=f&&e<u,b=p.classList.contains("active"),y=p.classList.contains("gap-exiting"),x=dt,S=b&&!y&&e>=u-x;if(g&&(!b||s)&&!y){p.classList.remove("gap-exiting"),s&&b&&(p.classList.remove("active"),p.offsetWidth);const w=u-f,F=h.getGapLoopDelay(w)+(e-f);p.style.setProperty("--gap-loop-delay",`-${F}ms`),p.classList.add("active"),this.activeGapLineElements.includes(p)||this.activeGapLineElements.push(p)}else if(S){p.classList.remove("active"),p.offsetWidth,p.classList.add("gap-exiting");const w=this.activeGapLineElements.indexOf(p);w!==-1&&this.activeGapLineElements.splice(w,1),setTimeout(()=>{p.classList.remove("gap-exiting")},dt)}else if(!g&&(b||y)){p.classList.remove("active"),p.classList.remove("gap-exiting");const w=this.activeGapLineElements.indexOf(p);w!==-1&&this.activeGapLineElements.splice(w,1)}else y&&e<u-x&&p.classList.remove("gap-exiting")});const o=this.findInstrumentalGapAt(e);if(o){if(this.lastInstrumentalIndex=o.insertBeforeIndex,o.insertBeforeIndex>0){const l=this._getLineElement(o.insertBeforeIndex-1);l&&l.classList.contains("persist-highlight")&&!l.classList.contains("active")&&h.unfinishSyllables(l)}}else this.lastInstrumentalIndex!==null&&(this.lastInstrumentalIndex=null);const d=this.lyrics&&this.lyrics.length>0?this.lyrics[this.lyrics.length-1]:null,c=this.lyricsContainer.querySelector(".lyrics-footer");if(c&&d&&d.endtime>0){const l=e>d.endtime+200;if(l&&!c.classList.contains("active")){c.classList.add("active");const p=this.lyricsContainer.querySelector(".lyrics-line:last-of-type");if(p){p.classList.remove("pre-active");const f=this.preActiveLineElements.indexOf(p);f!==-1&&this.preActiveLineElements.splice(f,1)}this.autoScroll&&!this.isUserScrolling&&!this.isClickSeeking&&this.focusLine(c)}else!l&&c.classList.contains("active")&&c.classList.remove("active")}}}updated(t){if(t.has("lyrics")&&(this._invalidateCaches(),this._ensureLineDataCache(),this._updateCachedIsUnsynced(),this._updateCharTimingData(),this.lyricsContainer&&this.lyrics)){const e=this.findActiveLineIndices(this.currentTime);for(const n of e){const r=this._getLineElement(n);r&&r.classList.add("active")}const i=this.getPrimaryActiveLineIndex(e);if(this.setBackgroundExpandedLine(i!==null?this._getLineElement(i):null),this._onTimeChanged(0,this.currentTime),this.positionedLineElements.length===0){const n=this.lyricsContainer.querySelector(".lyrics-line");n&&this.updatePositionClasses(n)}this.visibilityObserver?.disconnect(),this.visibilityObserver=new IntersectionObserver(n=>{n.forEach(r=>{r.target.classList.toggle("far-line",!r.isIntersecting)})},{root:this.lyricsContainer,rootMargin:"200px",threshold:0}),this.lyricsContainer.querySelectorAll(".lyrics-line").forEach(n=>this.visibilityObserver.observe(n))}if(t.has("duration")&&this.duration===-1){this.currentTime=0,this.activeLineIndices=[],this.activeMainWordIndices.clear(),this.activeBackgroundWordIndices.clear(),this.mainWordProgress.clear(),this.backgroundWordProgress.clear(),this.mainWordAnimations.clear(),this.backgroundWordAnimations.clear(),this.preActiveLineElements=[],this.positionedLineElements=[],this.activeGapLineElements=[],this.clearBackgroundExpandedLine(),this.setUserScrolling(!1),this.animationFrameId&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=void 0),this.userScrollTimeoutId&&(clearTimeout(this.userScrollTimeoutId),this.userScrollTimeoutId=void 0),this.scrollUnlockTimeout&&(clearTimeout(this.scrollUnlockTimeout),this.scrollUnlockTimeout=void 0),this.scrollAnimationTimeout&&(clearTimeout(this.scrollAnimationTimeout),this.scrollAnimationTimeout=void 0),this.lyricsContainer&&(this.lyricsContainer.scrollTop=0);return}(t.has("query")||t.has("musicId")||t.has("isrc")||t.has("ttml")||t.has("songTitle")||t.has("songArtist")||t.has("songAlbum")||t.has("songDurationMs"))&&!t.has("currentTime")&&this.fetchLyrics(),t.has("currentTime")&&this.lyrics}_handleActiveLineScroll(t,e=!1){if(!this.lyricsContainer||!this.lyrics||this.lyrics.length===0)return;if(this.lyricsContainer.querySelector(".lyrics-footer")?.classList.contains("active")){this.setBackgroundExpandedLine(null);return}let s=350,n=-1;for(let c=0;c<this.lyrics.length;c+=1)if(this.lyrics[c].timestamp>this.currentTime){n=c-1;break}if(n===-1&&this.lyrics.length>0&&this.currentTime>=this.lyrics[this.lyrics.length-1].timestamp&&(n=this.lyrics.length-1),n!==-1&&n+1<this.lyrics.length){const c=this.lyrics[n],p=this.lyrics[n+1].timestamp-c.endtime;s=Math.min(500,Math.max(350,p))}const r=this.currentTime+s,a=this.findActiveLineIndices(r);let o=null;if(a.length>0){const c=this.getPrimaryScrollLineIndex(a,r);c!==null&&c!==-1&&(o=this._getLineElement(c))}if(!o){const c=this.getLineIndexAtTime(r,0);c!==null&&c!==-1&&(o=this._getLineElement(c))}if(!o){this.setBackgroundExpandedLine(null);return}const d=s;o.style.setProperty("--scroll-duration",`${d}ms`),this.setBackgroundExpandedLine(o),o.classList.contains("active")||(o.classList.add("pre-active"),this.preActiveLineElements.includes(o)||this.preActiveLineElements.push(o)),this.focusLine(o,e,d)}_getTextWidth(t,e){return this._textWidthCanvas||(this._textWidthCanvas=document.createElement("canvas"),this._textWidthCtx=this._textWidthCanvas.getContext("2d",{willReadFrequently:!0})),this._textWidthCtx?(this._textWidthCtx.font=e,this._textWidthCtx.measureText(t).width):0}_rebuildDomCache(){if(!this.lyricsContainer||(this.lineElementCache.clear(),this.gapElementCache.clear(),this.cachedLineArray=[],!this.lyrics))return;for(let e=0;e<this.lyrics.length;e+=1){const i=this.lyricsContainer.querySelector(`#lyrics-line-${e}`);i&&this.lineElementCache.set(e,i);const s=this.lyricsContainer.querySelector(`#gap-${e}`);s&&(s._cachedStartTime=parseFloat(s.getAttribute("data-start-time")||"0"),s._cachedEndTime=parseFloat(s.getAttribute("data-end-time")||"0"),this.gapElementCache.set(e,s))}const t=this.lyricsContainer.querySelectorAll(".lyrics-line");this.cachedLineArray=Array.from(t)}_getLineElement(t){const e=this.lineElementCache.get(t);if(e)return e;if(!this.lyricsContainer)return null;const i=this.lyricsContainer.querySelector(`#lyrics-line-${t}`);return i&&this.lineElementCache.set(t,i),i}_getGapElement(t){const e=this.gapElementCache.get(t);if(e)return e;if(!this.lyricsContainer)return null;const i=this.lyricsContainer.querySelector(`#gap-${t}`);return i&&this.gapElementCache.set(t,i),i}_invalidateCaches(){this.cachedAllGaps=[],this.cachedIsUnsynced=!1,this.cachedLineData=null,this.lineElementCache.clear(),this.gapElementCache.clear(),this.cachedLineArray=[],this.cachedScrollPaddingTop=null,this.preActiveLineElements=[],this.positionedLineElements=[],this.activeGapLineElements=[],this.clearBackgroundExpandedLine(),this.visibilityObserver?.disconnect(),this.visibilityObserver=void 0}_updateCachedIsUnsynced(){this.cachedIsUnsynced=this.lyrics&&this.lyrics.length>0?this.lyrics.every(t=>t.timestamp===0&&t.endtime===0):!1}_ensureLineDataCache(){this.cachedLineData||!this.lyrics||(this.cachedLineData=this.lyrics.map(t=>{const e=[];let i=[];t.text.forEach((g,b)=>{i.push(g);const y=t.text[b+1];(!y||g.part===!1||/\s$/.test(g.text)||y&&g.isBackground!==y.isBackground)&&(e.push(i),i=[])}),i.length>0&&e.push(i);const s=new Array(e.length).fill(!1),n=new Array(e.length).fill(!1),r=new Array(e.length).fill(!1),a=new Array(e.length).fill(!1),o=new Array(e.length).fill(""),d=new Array(e.length).fill(0),c=new Array(e.length).fill(0),l=new Array(e.length).fill(0),p=new Array(e.length).fill(0);let f=!1,u=0;for(;u<e.length;){let g=u;for(;g<e.length-1;){const W=e[g],D=W[W.length-1].text;if(/\s$/.test(D))break;g+=1}const b=e.slice(u,g+1).flatMap(W=>W.map(D=>D.text)).join("").trim(),y=e[u][0].timestamp,x=e[g],S=x[x.length-1].endtime,w=S-y,P=/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(b),F=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0590-\u05FF]/.test(b);F&&(f=!0);const L=b.includes("-"),v=b.length,E=!P&&!F&&!L&&v>0,T=t.isWordSynced===!1||t.text.some(W=>W.lineSynced);let k=E&&v>0&&v<=7;k&&(v<=1?k=w>=1050&&w>=v*525:v<=3?k=w>=pi+(v-2)*140:k=w>=850&&w>=v*190);const _=w>=Math.max(700,v*85),$=v>=2&&v<=3&&w>=Math.max(ui,v*150),C=v>=4&&w>=Math.max(1300,v*260),M=E&&!T&&!k&&(v>=8&&_||v<8&&C),A=E&&!T&&!k&&$,I=k&&!T;let z=0;for(let W=u;W<=g;W+=1){s[W]=k,n[W]=I,r[W]=M,a[W]=A,o[W]=b,d[W]=w,c[W]=z,l[W]=y,p[W]=S;const D=e[W].map(q=>q.text).join("");z+=D.replace(/\s/g,"").length}u=g+1}return{wordGroups:e,groupGrowable:s,groupGlowing:n,groupCharRise:r,groupCharDrag:a,vwFullText:o,vwFullDuration:d,vwCharOffset:c,vwStartMs:l,vwEndMs:p,lineIsRTL:f}}))}_updateCharTimingData(){if(!this.shadowRoot)return;this._rebuildDomCache();const t=this.shadowRoot.querySelector(".lyrics-syllable");if(!t)return;const e=getComputedStyle(t),{font:i}=e,s=Array.from(this.shadowRoot.querySelectorAll(".lyrics-word.growable, .lyrics-word.char-rise, .lyrics-word.char-drag"));if(s.length===0)return;const n=new Map;s.forEach((r,a)=>{const o=r.dataset.virtualWordId||`word-${a}`,d=n.get(o);d?d.push(r):n.set(o,[r])}),n.forEach(r=>{const a=[];r.forEach(b=>{b.querySelectorAll(".lyrics-syllable-wrap").forEach(x=>{const S=x.querySelector(".lyrics-syllable");S&&a.push(S)})});const o=a.flatMap(b=>{const y=Array.from(b.querySelectorAll(".char")),x=b;return x._cachedCharSpans=y,y});if(o.length===0)return;r.forEach(b=>{const y=b;y._cachedVirtualWordElements=r,y._cachedVirtualWordCharSpans=o});const d=a.map(b=>{const y=b._cachedCharSpans,x=y.map(w=>this._getTextWidth(w.textContent||"",i)),S=x.reduce((w,P)=>w+P,0);return{syl:b,spans:y,charWidths:x,totalWidth:S,start:parseFloat(b.getAttribute("data-start-time")||""),end:parseFloat(b.getAttribute("data-end-time")||"")}}),c=d.reduce((b,y)=>b+y.totalWidth,0);if(c<=0)return;const l=Math.min(...d.map(b=>b.start).filter(b=>Number.isFinite(b))),p=Math.max(...d.map(b=>b.end).filter(b=>Number.isFinite(b))),f=p-l,u=Number.isFinite(l)&&Number.isFinite(p)&&f>0;let g=0;d.forEach(b=>{let y=0;const x=b.end-b.start,S=u&&Number.isFinite(b.start)&&Number.isFinite(b.end)&&x>0&&b.totalWidth>0;b.spans.forEach((w,P)=>{const F=b.charWidths[P];let L=g/c,v=F/c;if(S){const T=b.start-l+y/b.totalWidth*x,k=F/b.totalWidth*x;L=h.clamp(T/f,0,1),v=h.clamp(k/f,0,1)}const E=w;E.dataset.wipeStart=L.toFixed(4),E.dataset.wipeDuration=v.toFixed(4),E.style.setProperty("--word-wipe-width",`${c}px`),E.style.setProperty("--char-wipe-position",`${-g}px`),g+=F,y+=F})})})}static arraysEqual(t,e){return t.length===e.length&&t.every((i,s)=>i===e[s])}static isLineSyncedLine(t){return t?t.isWordSynced===!1||t.text.some(e=>e.lineSynced):!1}getLineHighlightEndTime(t){if(!this.lyrics)return 0;const e=this.lyrics[t];if(!e)return 0;const i=Math.max(e.endtime,e.timestamp),s=this.lyrics[t+1];return!s||s.timestamp<=e.timestamp?i>e.timestamp?i+200:i:i>e.timestamp&&(s.timestamp<i||s.timestamp-i>=xt)?i:s.timestamp}static getLineIndexFromElement(t){if(!t)return null;const e=t.id.match(/^lyrics-line-(\d+)$/);return e?parseInt(e[1],10):null}static getGapLoopDelay(t){const e=Rt,s=((t-dt)%ct+ct)%ct;return((e-s)%ct+ct)%ct}clearPreActiveClasses(t=null){if(!this.lyricsContainer)return;const e=[];for(const i of this.preActiveLineElements)h.getLineIndexFromElement(i)===t?e.push(i):i.classList.remove("pre-active");this.preActiveLineElements=e}setBackgroundExpandedLine(t){const e=t&&!t.classList.contains("lyrics-gap")&&t.querySelector(".background-vocal-container")?t:null;if(this.backgroundExpandedLine===e){e&&!e.classList.contains("bg-expanded")&&e.classList.add("bg-expanded");return}this.backgroundExpandedLine?.classList.remove("bg-expanded"),this.backgroundExpandedLine=e,e?.classList.add("bg-expanded")}clearBackgroundExpandedLine(){this.backgroundExpandedLine?.classList.remove("bg-expanded"),this.backgroundExpandedLine=null}getPrimaryActiveLineIndex(t){if(t.length===0)return null;const e=t[0],i=t[t.length-1];let s=Math.max(e,i-2);const n=h.getLineIndexFromElement(this.currentPrimaryActiveLine);return n!==null&&t.includes(n)&&(t.length<=3||s<n)&&(s=n),s}getPrimaryScrollLineIndex(t,e){if(!this.lyrics||this.lyrics.length===0)return null;const i=this.getLineIndexAtTime(e,this.lastActiveIndex);if(i===-1)return null;const s=h.getLineIndexFromElement(this.currentPrimaryActiveLine);return s!==null&&i>s&&this.lyrics[s]&&this.lyrics[i]&&this.lyrics[s].endtime===this.lyrics[i].endtime&&this.findActiveLineIndices(e).length<=3?s:i}getOverlapClusterForActiveIndices(t,e){if(!this.lyrics||t.length===0)return null;let i=t[0];for(;i>0&&this.lyrics[i-1].endtime>=this.lyrics[i].timestamp;)i-=1;let s=i,n=this.lyrics[i].endtime;for(;s+1<this.lyrics.length&&this.lyrics[s+1].timestamp<=n;)s+=1,n=Math.max(n,this.lyrics[s].endtime);let r=i,a=this.lyrics[i].endtime;for(let o=i;o<=s&&this.lyrics[o].timestamp<=e;o+=1)r=o,a=Math.max(a,this.lyrics[o].endtime);return{start:i,end:s,startedEnd:r,startedEndTime:a}}focusLine(t,e=!1,i=void 0,s=!1,n=!1){const r=t!==this.currentPrimaryActiveLine;if(r&&!n){this.lastPrimaryActiveLine=this.currentPrimaryActiveLine,this.currentPrimaryActiveLine=t;const a=h.getLineIndexFromElement(t);a!==null&&(this.lastActiveIndex=a)}(r||e)&&this.updatePositionClasses(t),!s&&(e||r||n)&&this.autoScroll&&!this.isUserScrolling&&!this.isClickSeeking&&this.scrollToActiveLineYouLy(t,e,i)}setUserScrolling(t){this.isUserScrolling=t,t?this.lyricsContainer?.classList.add("user-scrolling"):this.lyricsContainer?.classList.remove("user-scrolling")}handleUserScroll(){this.isProgrammaticScroll||this.isClickSeeking||(this.setUserScrolling(!0),this.clearPastLineHighlights(),this.userScrollTimeoutId&&clearTimeout(this.userScrollTimeoutId),this.userScrollTimeoutId=window.setTimeout(()=>{this.setUserScrolling(!1),this.userScrollTimeoutId=void 0,this.activeLineIndices.length>0&&this._handleActiveLineScroll([],!1)},2e3))}clearPastLineHighlights(){if(!this.lyricsContainer)return;const t=this.cachedLineArray.length?this.cachedLineArray:Array.from(this.lyricsContainer.querySelectorAll(".lyrics-line:not(.lyrics-gap)")),i=this.lyricsContainer.getBoundingClientRect().top+this.getScrollPaddingTop();for(let s=0;s<t.length;s+=1){const n=t[s],r=n.classList.contains("active"),o=n.getBoundingClientRect().bottom<i-2;!r&&o&&h.unfinishSyllables(n)}}getLineIndexAtTime(t,e=0){if(!this.lyrics||this.lyrics.length===0)return-1;const i=this.lyrics.length,s=Math.max(0,Math.min(e,i-1));for(let n=s;n<i;n+=1){const r=this.lyrics[n];if(r.timestamp>t)break;if(t>=r.timestamp&&t<r.endtime)return n}for(let n=s-1;n>=0;n-=1){const r=this.lyrics[n];if(t>=r.timestamp&&t<r.endtime)return n;if(r.endtime<t)break}for(let n=0;n<i;n+=1){const r=this.lyrics[n];if(r.timestamp>t)break;if(t>=r.timestamp&&t<r.endtime)return n}return-1}findActiveLineIndices(t){if(!this.lyrics||this.lyrics.length===0)return[];const e=[];for(let i=0;i<this.lyrics.length;i+=1){const s=this.lyrics[i],n=this.getLineHighlightEndTime(i);if(s.timestamp>t)break;t>=s.timestamp&&t<n&&e.push(i)}return e}findInstrumentalGapAt(t){if(!this.lyrics||this.lyrics.length===0)return null;const e=this.lyrics[0];if(t>=0&&t<e.timestamp){const s=e.timestamp;return s-0>=xt?{insertBeforeIndex:0,gapStart:0,gapEnd:s}:null}for(let i=0;i<this.lyrics.length-1;i+=1){const s=this.lyrics[i],n=this.lyrics[i+1],r=s.endtime,a=n.timestamp;if(t>r&&t<a)return a-r>=xt?{insertBeforeIndex:i+1,gapStart:r,gapEnd:a}:null}return null}findAllInstrumentalGaps(){if(this.cachedAllGaps.length>0)return this.cachedAllGaps;if(!this.lyrics||this.lyrics.length===0)return[];const t=[],e=this.lyrics[0];e.timestamp>=xt&&t.push({insertBeforeIndex:0,gapStart:0,gapEnd:e.timestamp});for(let i=0;i<this.lyrics.length-1;i+=1){const s=this.lyrics[i],n=this.lyrics[i+1],r=s.endtime,a=n.timestamp;a-r>=xt&&t.push({insertBeforeIndex:i+1,gapStart:r,gapEnd:a})}return this.cachedAllGaps=t,t}startAnimationFromTime(t){if(this.animationFrameId&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=void 0),!this.lyrics)return;const e=this.findActiveLineIndices(t);if(h.arraysEqual(e,this.activeLineIndices)||(this.activeLineIndices=e),this.activeMainWordIndices.clear(),this.activeBackgroundWordIndices.clear(),this.mainWordAnimations.clear(),this.backgroundWordAnimations.clear(),this.mainWordProgress.clear(),this.backgroundWordProgress.clear(),e.length!==0){for(const i of e){const s=this.lyrics[i];let n=-1;for(let a=0;a<s.text.length;a+=1)if(t>=s.text[a].timestamp&&t<=s.text[a].endtime){n=a;break}this.activeMainWordIndices.set(i,n);let r=-1;if(s.backgroundText){for(let a=0;a<s.backgroundText.length;a+=1)if(t>=s.backgroundText[a].timestamp&&t<=s.backgroundText[a].endtime){r=a;break}}this.activeBackgroundWordIndices.set(i,r)}this.setupAnimations(),this.interpolate&&this.animateProgress()}}updateActiveLineAndWords(){if(!this.lyrics)return;const t=this.findActiveLineIndices(this.currentTime);h.arraysEqual(t,this.activeLineIndices)||(this.activeLineIndices=t),this.activeMainWordIndices.clear(),this.activeBackgroundWordIndices.clear();for(const e of t){const i=this.lyrics[e];let s=-1;for(let r=0;r<i.text.length;r+=1)if(this.currentTime>=i.text[r].timestamp&&this.currentTime<=i.text[r].endtime){s=r;break}this.activeMainWordIndices.set(e,s);let n=-1;if(i.backgroundText){for(let r=0;r<i.backgroundText.length;r+=1)if(this.currentTime>=i.backgroundText[r].timestamp&&this.currentTime<=i.backgroundText[r].endtime){n=r;break}}this.activeBackgroundWordIndices.set(e,n)}}setupAnimations(){if(this.activeLineIndices.length===0||!this.lyrics){this.mainWordAnimations.clear(),this.backgroundWordAnimations.clear();return}for(const t of this.activeLineIndices){const e=this.lyrics[t],i=this.activeMainWordIndices.get(t)??-1,s=this.activeBackgroundWordIndices.get(t)??-1;if(i!==-1){const n=e.text[i],r=n.endtime-n.timestamp,a=this.currentTime-n.timestamp;this.mainWordAnimations.set(t,{startTime:performance.now()-a,duration:r})}else this.mainWordAnimations.set(t,{startTime:0,duration:0});if(s!==-1&&e.backgroundText){const n=e.backgroundText[s],r=n.endtime-n.timestamp,a=this.currentTime-n.timestamp;this.backgroundWordAnimations.set(t,{startTime:performance.now()-a,duration:r})}else this.backgroundWordAnimations.set(t,{startTime:0,duration:0})}}handleLineClick(t){this.lyricsContainer&&(this.lyricsContainer.querySelectorAll(".lyrics-line").forEach(n=>{h.resetSyllables(n),n.classList.remove("scroll-animate"),n.style.removeProperty("--scroll-delta"),n.style.removeProperty("--lyrics-line-delay")}),this.lyricsContainer.classList.remove("wheel-scrolling")),this.scrollAnimationState&&(this.scrollAnimationState.isAnimating=!1,this.scrollAnimationState.pendingUpdate=null),this.scrollAnimationTimeout&&(clearTimeout(this.scrollAnimationTimeout),this.scrollAnimationTimeout=void 0),this.userScrollTimeoutId&&(clearTimeout(this.userScrollTimeoutId),this.userScrollTimeoutId=void 0),this.setUserScrolling(!1),this.currentPrimaryActiveLine=null,this.lastPrimaryActiveLine=null,this.activeLineIds.clear(),this.animatingLines=[],this.setBackgroundExpandedLine(null);const e=this.lyricsContainer?.querySelector(`.lyrics-line[data-start-time="${t.text[0]?.timestamp||0}"]`);e&&this.lyricsContainer&&(this.currentPrimaryActiveLine=e,this.currentScrollOffset=-this.lyricsContainer.scrollTop,this.isClickSeeking=!0,this.clickSeekTimeout&&clearTimeout(this.clickSeekTimeout),this.clickSeekTimeout=setTimeout(()=>{this.isClickSeeking=!1},800),this.scrollToActiveLineYouLy(e,!0),this.setBackgroundExpandedLine(e));const i=new CustomEvent("line-click",{detail:{timestamp:t.timestamp},bubbles:!0,composed:!0});this.dispatchEvent(i)}static getBackgroundTextPlacement(t){if(!t.backgroundText||t.backgroundText.length===0||t.text.length===0)return"after";const e=t.text[0].timestamp;return t.backgroundText[0].timestamp<e?"before":"after"}scrollToActiveLine(){if(!this.lyricsContainer||this.activeLineIndices.length===0)return;const t=Math.min(...this.activeLineIndices),e=this.lyricsContainer.querySelector(`.lyrics-line:nth-child(${t+1})`);if(e){const i=this.lyricsContainer.clientHeight,s=e.offsetTop,n=e.clientHeight,r=e.querySelector(".background-text.before");let a=0;r&&(a=r.clientHeight/2);const o=s-i/2+n/2-a;requestAnimationFrame(()=>{this.isProgrammaticScroll=!0,this.lyricsContainer?.scrollTo({top:o,behavior:"smooth"}),setTimeout(()=>{this.isProgrammaticScroll=!1},100)})}}scrollToInstrumental(t){if(!this.lyricsContainer)return;const e=this.lyricsContainer.querySelector(`#gap-${t}`);if(e){const s=this.getScrollPaddingTop()-e.offsetTop;this.isProgrammaticScroll=!0,this.clearPastLineHighlights(),this.animateScrollYouLy(s,!1),setTimeout(()=>{this.isProgrammaticScroll=!1},250)}}getScrollPaddingTop(){if(this.cachedScrollPaddingTop!==null)return this.cachedScrollPaddingTop;if(!this.lyricsContainer)return 0;const e=getComputedStyle(this).getPropertyValue("--lyrics-scroll-padding-top")||"25%";let i;return e.includes("%")?i=this.lyricsContainer.clientHeight*(parseFloat(e)/100):i=parseFloat(e)||0,this.cachedScrollPaddingTop=i,i}animateScrollYouLy(t,e=!1,i=void 0){if(!this.lyricsContainer)return;const s=this.lyricsContainer,n=Math.max(0,-t);this.scrollAnimationState||(this.scrollAnimationState={isAnimating:!1,pendingUpdate:null},this.animatingLines=[]);const r=this.scrollAnimationState;if(r.isAnimating&&!e){const v=r.pendingUpdate===null?null:Math.max(0,-r.pendingUpdate);if(Math.abs(s.scrollTop-n)<2||v!==null&&Math.abs(v-n)<2)return;r.pendingUpdate=t;return}this.scrollAnimationTimeout&&(clearTimeout(this.scrollAnimationTimeout),this.scrollAnimationTimeout=void 0),this.scrollUnlockTimeout&&(clearTimeout(this.scrollUnlockTimeout),this.scrollUnlockTimeout=void 0);const{animatingLines:a}=this,o=-n,c=-s.scrollTop-o;if(this.currentScrollOffset=o,Math.abs(s.scrollTop-n)<1&&Math.abs(c)<1){r.isAnimating=!1,r.pendingUpdate=null;return}if(e){for(const v of a)v.classList.remove("scroll-animate"),v.style.removeProperty("--scroll-delta"),v.style.removeProperty("--lyrics-line-delay"),v.style.removeProperty("--scroll-duration");a.length=0,s.scrollTo({top:n,behavior:"smooth"}),r.isAnimating=!1,r.pendingUpdate=null;return}for(const v of a)v.classList.remove("scroll-animate"),v.style.removeProperty("--scroll-delta"),v.style.removeProperty("--lyrics-line-delay"),v.style.removeProperty("--scroll-duration");if(a.length=0,this.cachedLineArray.length===0){const v=this.lyricsContainer.querySelectorAll(".lyrics-line");this.cachedLineArray=Array.from(v)}const l=this.cachedLineArray,p=this.currentPrimaryActiveLine||this.lastPrimaryActiveLine||l[0];if(!p)return;const f=l.indexOf(p);if(f===-1)return;const u=Math.min(450,i??ce),g=u*.1,b=20,y=l.length,x=Math.max(0,f-b),S=Math.min(y,f+b);let w=0;const P=[];if(c>=0){let v=0;for(let E=x;E<S;E+=1){const T=l[E],k=E>=f?v*g:0;E>=f&&!T.classList.contains("lyrics-gap")&&(v+=1),T.style.setProperty("--scroll-delta",`${c}px`),T.style.setProperty("--lyrics-line-delay",`${k}ms`),T.style.setProperty("--scroll-duration",`${u+100}ms`),P.push(T);const _=u+k;_>w&&(w=_)}}else{let v=0;for(let E=S-1;E>=x;E-=1){const T=l[E],k=E<=f?v*g:0;E<=f&&!T.classList.contains("lyrics-gap")&&(v+=1),T.style.setProperty("--scroll-delta",`${c}px`),T.style.setProperty("--lyrics-line-delay",`${k}ms`),T.style.setProperty("--scroll-duration",`${u+100}ms`),P.push(T);const _=u+k;_>w&&(w=_)}}s.offsetHeight;for(const v of P)v.classList.add("scroll-animate"),a.push(v);r.isAnimating=!0;const L=400;this.scrollUnlockTimeout=setTimeout(()=>{if(r.isAnimating=!1,r.pendingUpdate!==null){const v=r.pendingUpdate;r.pendingUpdate=null,this.animateScrollYouLy(v,!1,i)}},L),this.scrollAnimationTimeout=setTimeout(()=>{for(let v=0;v<a.length;v+=1){const E=a[v];E.classList.remove("scroll-animate"),E.style.removeProperty("--scroll-delta"),E.style.removeProperty("--lyrics-line-delay"),E.style.removeProperty("--scroll-duration")}a.length=0,this.scrollAnimationTimeout=void 0},w+50),s.scrollTo({top:n,behavior:"instant"})}updatePositionClasses(t){if(!this.lyricsContainer)return;const e=["lyrics-activest","post-active-line","next-active-line","prev-1","prev-2","prev-3","prev-4","next-1","next-2","next-3","next-4"];for(const n of this.positionedLineElements)n.classList.remove(...e);this.positionedLineElements=[],t.classList.add("lyrics-activest"),this.positionedLineElements.push(t),this.cachedLineArray.length===0&&(this.cachedLineArray=Array.from(this.lyricsContainer.querySelectorAll(".lyrics-line")));const i=this.cachedLineArray,s=i.indexOf(t);if(s!==-1)for(let n=Math.max(0,s-4);n<=Math.min(i.length-1,s+4);n+=1){const r=n-s;if(r!==0){const a=i[n];r===-1?a.classList.add("post-active-line"):r===1?a.classList.add("next-active-line"):r<0?a.classList.add(`prev-${Math.abs(r)}`):a.classList.add(`next-${r}`),this.positionedLineElements.push(a)}}}scrollToActiveLineYouLy(t,e=!1,i=void 0){if(!t||!this.lyricsContainer)return;const s=this.getScrollPaddingTop(),n=s-t.offsetTop,r=this.lyricsContainer.getBoundingClientRect().top;if(!e&&Math.abs(t.getBoundingClientRect().top-r-s)<1)return;if(!e&&!t.classList.contains("lyrics-footer")){const o=this.lyricsContainer,d=o.scrollTop+o.clientHeight>=o.scrollHeight-50,c=Math.max(0,-(s-t.offsetTop));if(d&&c>o.scrollTop-50)return}this.lyricsContainer.classList.remove("not-focused","user-scrolling"),this.isProgrammaticScroll=!0,this.setUserScrolling(!1),this.userScrollTimeoutId&&(clearTimeout(this.userScrollTimeoutId),this.userScrollTimeoutId=void 0),this.clearPastLineHighlights(),setTimeout(()=>{this.isProgrammaticScroll=!1},(i??ce)+160),this.animateScrollYouLy(n,e,i)}static clamp(t,e,i){return Math.min(i,Math.max(e,t))}static getVisibleCharacterCount(t){const e=parseFloat(t.getAttribute("data-word-length")||"");return Number.isFinite(e)&&e>0?e:(t.textContent||"").replace(/\s/g,"").length}static getLongWordWipeScale(t){return t<=6?1:1+h.clamp((t-6)/10,0,1)*hi}static applyWipeShape(t,e){const i=h.clamp((e-6)/10,0,1)*di,s=ci+i;t.style.setProperty("--wipe-gradient-width",`${s.toFixed(3)}em`),t.style.setProperty("--wipe-gradient-half",`${(s/2).toFixed(3)}em`)}static ensureWordWipeGeometry(t,e){if(t.length===0)return;const i=Math.max(1,e||t.length);t.forEach((s,n)=>{if(s.style.getPropertyValue("--word-wipe-width")||s.style.setProperty("--word-wipe-width",`${i}ch`),!s.style.getPropertyValue("--char-wipe-position")){const r=Number.parseFloat(s.dataset.wipeStart||`${n/Math.max(1,t.length)}`);s.style.setProperty("--char-wipe-position",`${-(h.clamp(r,0,1)*i)}ch`)}})}static clearPreHighlight(t){const e=t;e.classList.remove("pre-highlight"),e.style.removeProperty("--pre-wipe-duration"),e.style.removeProperty("--pre-wipe-delay"),e.style.animation="",e.querySelectorAll(".pre-wipe-lead").forEach(i=>h.clearPreWipeLead(i))}static clearPreWipeLead(t){t.classList.remove("pre-wipe-lead"),t.style.removeProperty("--pre-wipe-duration"),t.style.removeProperty("--pre-wipe-delay")}static hasTextBoundaryAfter(t){return/\s$/.test(t.textContent||"")}static getSyllableWordIndex(t){const e=h.getWordElementForSyllable(t),i=e?.dataset.virtualWordId;if(i)return`virtual:${i}`;const s=e?.dataset.virtualWordStart,n=e?.dataset.virtualWordEnd;return s||n?`virtual:${s||""}:${n||""}`:t.getAttribute("data-word-index")||t.getAttribute("data-syllable-index")||""}static getNextWordSyllable(t,e){const i=t[e],s=h.getSyllableWordIndex(i),n=i;for(let r=e+1;r<t.length;r+=1){const a=t[r];if(a.classList.contains("transliteration"))continue;return h.getSyllableWordIndex(a)===s||!h.hasTextBoundaryAfter(n)?null:a}return null}static getPreviousNonTransliterationSyllable(t,e){for(let i=e-1;i>=0;i-=1){const s=t[i];if(!s.classList.contains("transliteration"))return s}return null}static getRenderedWordSyllables(t){const e=h.getWordElementForSyllable(t);return h.getCachedVirtualWordElements(e).flatMap(n=>Array.from(n.querySelectorAll(".lyrics-syllable"))).filter(n=>!n.classList.contains("transliteration"))}static getWordElementForSyllable(t){return t.parentElement?.parentElement}static getWordPreWipeKey(t){return h.getWordElementForSyllable(t)?.dataset.virtualWordId||`${t.getAttribute("data-start-time")||""}:${h.getSyllableWordIndex(t)}`}static isPreWipeArmed(t){return h.getWordElementForSyllable(t)?._wordPreWipeKey===h.getWordPreWipeKey(t)}static applyWordPreWipe(t,e,i,s,n){if(h.isPreWipeArmed(t))return;const r=h.getWordElementForSyllable(t),a=h.getCachedVirtualWordElements(r),o=h.getCachedVirtualWordCharSpans(r,[]),d=i-s,c=o.length||e.reduce((g,b)=>g+h.getVisibleCharacterCount(b),0)||h.getVisibleCharacterCount(t);h.ensureWordWipeGeometry(o,c);const l=o[0],f=l?.closest(".lyrics-syllable")||e[0]||t;h.applyWipeShape(f,c),f.style.setProperty("--pre-wipe-duration",`${n}ms`),f.style.setProperty("--pre-wipe-delay",`${-d}ms`),f.classList.add("pre-highlight");let u=o;u.length===0&&l&&(u=[l]),u.forEach(g=>{h.applyWipeShape(g,c),g.style.setProperty("--pre-wipe-duration",`${n}ms`),g.style.setProperty("--pre-wipe-delay",`${-d}ms`),g.classList.add("pre-wipe-lead")}),a.forEach(g=>{const b=g;b._wordPreWipeKey=h.getWordPreWipeKey(t)})}static maybePreWipeNextWord(t,e,i,s){const n=t[e];if(n.classList.contains("line-synced")||n.classList.contains("transliteration")||n.closest(".lyrics-gap")||!(n.classList.contains("finished")||i>=s-de))return;const a=h.getNextWordSyllable(t,e);if(!a||a.classList.contains("line-synced")||a.classList.contains("transliteration")||a.closest(".lyrics-gap")||a.classList.contains("highlight")||a.classList.contains("finished"))return;const o=a._cachedStartTime;if(!Number.isFinite(o))return;const d=o-s;if(d>ai||d<-50)return;const c=h.getRenderedWordSyllables(a),l=c.length>0?c:[a],p=h.getWordElementForSyllable(a),u=h.getCachedVirtualWordCharSpans(p,[]).length||l.reduce((y,x)=>y+h.getVisibleCharacterCount(x),0);if(u<=0)return;const g=h.clamp(64+u*9,oi,li),b=Math.max(o-g,s-de);i<b||i>=o||h.applyWordPreWipe(a,l,i,b,g)}static getCachedCharSpans(t){const e=t;return e._cachedCharSpans||(e._cachedCharSpans=Array.from(t.querySelectorAll("span.char"))),e._cachedCharSpans}static getCachedVirtualWordElements(t){if(!t)return[];const e=t;if(e._cachedVirtualWordElements)return e._cachedVirtualWordElements;const{virtualWordId:i}=t.dataset;let s=[t];return i&&t.parentElement&&(s=Array.from(t.parentElement.querySelectorAll(".lyrics-word")).filter(n=>n.dataset.virtualWordId===i)),s.forEach(n=>{const r=n;r._cachedVirtualWordElements=s}),s}static getCachedVirtualWordCharSpans(t,e){if(!t)return e;const i=t;if(i._cachedVirtualWordCharSpans)return i._cachedVirtualWordCharSpans;const s=h.getCachedVirtualWordElements(t),n=s.flatMap(a=>Array.from(a.querySelectorAll("span.char"))),r=n.length>0?n:e;return s.forEach(a=>{const o=a;o._cachedVirtualWordCharSpans=r}),r}static updateSyllableAnimation(t,e=0){if(t.classList.contains("highlight"))return;const{classList:i}=t,s=i.contains("pre-highlight"),n=i.contains("rtl-text"),r=h.getCachedCharSpans(t),o=t.parentElement?.parentElement,d=h.getCachedVirtualWordElements(o),c=h.getCachedVirtualWordCharSpans(o,r),l=o?.classList.contains("growable"),p=o?.classList.contains("char-rise"),f=o?.classList.contains("char-drag"),u=t.getAttribute("data-syllable-index")==="0",g=parseFloat(t.getAttribute("data-start-time")||"0"),b=parseFloat(o?.dataset.virtualWordStart||""),y=u&&(!Number.isFinite(b)||Math.abs(g-b)<.5),x=u,S=t.closest(".lyrics-gap")!==null,w=parseFloat(t.getAttribute("data-duration")||"0")||300,P=parseFloat(t.getAttribute("data-word-duration")||t.getAttribute("data-duration")||"0")||w,F=Number.isFinite(b)?e+(g-b):e,L=Math.max(P,w),v=new Map,E=[];if(l&&y&&c.length>0){const T=P,k=T*.09,_=T*1.5;c.forEach($=>{const C=$.dataset.matrixScale||"1.1",M=$.dataset.charOffsetX||"0",A=$.dataset.shadowIntensity||"0.6",I=$.dataset.translateYPeak||"-2",z=parseFloat($.dataset.syllableCharIndex||"0"),W=k*z;v.set($,`grow-dynamic ${_}ms ease-in-out ${W}ms forwards`),E.push({element:$,property:"--matrix-scale",value:C}),E.push({element:$,property:"--char-offset-x",value:`${M}px`}),E.push({element:$,property:"--shadow-intensity",value:A}),E.push({element:$,property:"--translate-y-peak",value:`${I}px`})})}if(p&&y&&c.length>0){const T=Math.max(P,w),k=T*.09,_=T*1.5;c.forEach($=>{const C=parseFloat($.dataset.syllableCharIndex||"0"),M=k*C;v.set($,`rise-char ${_}ms ease-in-out ${M}ms forwards`)})}if(f&&y&&c.length>0){const T=Math.max(P,w),k=h.clamp(T*.15,64,118),_=h.clamp(T*.82,560,900);c.forEach($=>{const C=parseFloat($.dataset.syllableCharIndex||"0"),M=k*C;v.set($,`drag-char ${_}ms ease ${M}ms forwards`)})}if(r.length>0){const T=c.length||r.length||h.getVisibleCharacterCount(t),k=h.getLongWordWipeScale(T);h.applyWipeShape(t,T),h.ensureWordWipeGeometry(c,T),c.forEach(C=>h.applyWipeShape(C,T));const _=!y&&(!!o?._wordWipeStarted||c.some(C=>C.style.animation.includes("wipe")));let $=r;y?$=c:_&&($=[]),$.length>0&&d.length>0&&d.forEach(C=>{const M=C;M._wordWipeStarted=!0,M._wordPreWipeKey=void 0}),$.forEach((C,M)=>{const A=parseFloat(C.dataset.wipeStart||"0"),I=parseFloat(C.dataset.wipeDuration||"0"),z=parseFloat(C.dataset.syllableCharIndex||`${M}`),W=C.classList.contains("pre-wipe-lead")||s&&z===0,D=L*A,q=Math.max(0,L-D);let j=D-F,ht=Math.min(L*I*k,q);const Ft=x&&z===0&&!W;let G="wipe";W?(G="wipe-word-from-pre",j=-F,ht=L):Ft?G=n?"start-wipe-rtl":"start-wipe":G=n?"wipe-rtl":"wipe";const N=v.get(C)||C.style.animation||"",ut=[];if(N&&(N.includes("grow-dynamic")||N.includes("rise-char")||N.includes("drag-char"))&&ut.push(N.split(",")[0].trim()),ht>0){const zt=W?"both":"forwards";ut.push(`${G} ${ht}ms linear ${j}ms ${zt}`)}ut.length>0&&v.set(C,ut.join(", "))})}else{const T=parseFloat(t.getAttribute("data-wipe-ratio")||"1"),k=h.getVisibleCharacterCount(t),_=h.getLongWordWipeScale(k),$=w*T*_;h.applyWipeShape(t,k);let C="wipe";if(s?C=n?"wipe-from-pre-rtl":"wipe-from-pre":x?C=n?"start-wipe-rtl":"start-wipe":C=n?"wipe-rtl":"wipe",t.classList.contains("line-synced"))return;const M=S?"fade-gap":C;t.style.animation=`${M} ${$}ms ${S?"ease-out":"linear"} ${-e}ms forwards`}d.length>0&&d.forEach(T=>{const k=T;k._wordPreWipeKey=void 0}),i.remove("pre-highlight"),i.add("highlight"),c.forEach(T=>h.clearPreWipeLead(T));for(const T of E)T.element.style.setProperty(T.property,T.value);for(const[T,k]of v.entries())T.style.willChange="transform",T.style.removeProperty("background-color"),T.style.animation=k}static resetSyllable(t){if(!t)return;t.style.animation="",t.style.removeProperty("--pre-wipe-duration"),t.style.removeProperty("--pre-wipe-delay"),t.style.transition="none",t.style.backgroundColor="var(--lyplus-text-secondary)";const e=t.querySelectorAll("span.char");for(let i=0;i<e.length;i+=1){const s=e[i];s.style.animation="",s.style.transition="none",s.style.backgroundColor="var(--lyplus-text-secondary)",h.clearPreWipeLead(s)}t.classList.remove("highlight","finished","pre-highlight","cleanup")}static resetWordAnimationState(t){t.querySelectorAll(".lyrics-word").forEach(i=>{const s=i;s._wordPreWipeKey=void 0,s._wordWipeStarted=!1})}static resetSyllables(t){if(!t)return;t.classList.remove("persist-highlight"),h.resetWordAnimationState(t),t._cachedSyllableElements=null;const e=t.getElementsByClassName("lyrics-syllable");for(let i=0;i<e.length;i+=1)h.resetSyllable(e[i]);requestAnimationFrame(()=>{for(let i=0;i<e.length;i+=1){const s=e[i];s.style.removeProperty("background-color"),s.style.removeProperty("transition");const n=s.querySelectorAll("span.char");for(let r=0;r<n.length;r+=1){const a=n[r];a.style.removeProperty("background-color"),a.style.removeProperty("transition"),a.style.removeProperty("will-change")}}})}static unfinishSyllables(t){if(!t)return;t.classList.remove("persist-highlight"),h.resetWordAnimationState(t);const e=t.getElementsByClassName("lyrics-syllable");for(let i=0;i<e.length;i+=1){const s=e[i];s.classList.remove("highlight","finished","pre-highlight","cleanup"),s.style.animation="",s.style.removeProperty("--pre-wipe-duration"),s.style.removeProperty("--pre-wipe-delay"),s.style.removeProperty("background-color"),s.style.removeProperty("transition");const n=s.querySelectorAll("span.char");for(let r=0;r<n.length;r+=1){const a=n[r];a.style.animation="",a.style.removeProperty("will-change"),a.style.removeProperty("background-color"),a.style.removeProperty("transition"),a.style.removeProperty("filter"),h.clearPreWipeLead(a)}}}static finishSyllablesUpToTime(t,e){if(!t)return;let i=!1,s=t._cachedSyllableElements;if(!s){s=Array.from(t.querySelectorAll(".lyrics-syllable"));for(let n=0;n<s.length;n+=1){const r=s[n];r._cachedStartTime=parseFloat(r.getAttribute("data-start-time")||"0"),r._cachedEndTime=parseFloat(r.getAttribute("data-end-time")||"0")}t._cachedSyllableElements=s}for(let n=0;n<s.length;n+=1){const r=s[n],a=r._cachedStartTime;if(Number.isFinite(a)&&e>=a){const{classList:o}=r;o.contains("finished")||(o.contains("highlight")||h.updateSyllableAnimation(r,Math.max(0,e-a)),o.add("finished")),i=!0,o.remove("highlight"),o.remove("pre-highlight"),o.add("cleanup"),r.style.animation="",r.style.removeProperty("--pre-wipe-duration"),r.style.removeProperty("--pre-wipe-delay"),r.style.removeProperty("background-color"),h.applyWipeShape(r,h.getVisibleCharacterCount(r));const d=r.querySelectorAll("span.char");for(let c=0;c<d.length;c+=1){const l=d[c],p=l.style.animation||"";if(p.includes("grow-dynamic")||p.includes("rise-char")||p.includes("drag-char")){const u=p.split(",").map(g=>g.trim()).find(g=>g.includes("grow-dynamic")||g.includes("rise-char")||g.includes("drag-char"));l.style.animation=u||""}else l.style.animation="";l.style.backgroundColor="var(--lyplus-text-primary)",h.clearPreWipeLead(l)}}}i?t.classList.add("persist-highlight"):t.classList.remove("persist-highlight")}static updateSyllablesForLine(t,e){let i=t._cachedSyllableElements;if(!i){i=Array.from(t.querySelectorAll(".lyrics-syllable"));for(let s=0;s<i.length;s+=1){const n=i[s];n._cachedStartTime=parseFloat(n.getAttribute("data-start-time")||"0"),n._cachedEndTime=parseFloat(n.getAttribute("data-end-time")||"0")}t._cachedSyllableElements=i}for(let s=0;s<i.length;s+=1){const n=i[s],r=n._cachedStartTime,a=n._cachedEndTime;if(Number.isFinite(r)&&Number.isFinite(a)){const{classList:o}=n,d=o.contains("highlight"),c=o.contains("finished"),l=o.contains("pre-highlight"),p=d||c||l;if(!(e<r-1e3&&!p)){let f=!1;if(l&&e<r){const u=h.getPreviousNonTransliterationSyllable(i,s);u?.classList.contains("highlight")||u?.classList.contains("finished")||(h.clearPreHighlight(n),f=!0)}f||(e>=r&&e<=a?(d||h.updateSyllableAnimation(n,e-r),c&&o.remove("finished")):e>a?c||(d||h.updateSyllableAnimation(n,e-r),o.add("finished")):(d||c)&&h.resetSyllable(n),h.maybePreWipeNextWord(i,s,e,a))}}}}animateProgress(){const t=performance.now();let e=!1;if(!this.lyrics||this.activeLineIndices.length===0){this.animationFrameId&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=void 0);return}for(const i of this.activeLineIndices){const s=this.lyrics[i],n=this.mainWordAnimations.get(i);if(n&&n.duration>0){const a=t-n.startTime;if(a>=0){const o=Math.min(1,a/n.duration);if(this.mainWordProgress.set(i,o),o<1)e=!0;else{const d=this.activeMainWordIndices.get(i)??-1,c=d+1;if(d!==-1&&c<s.text.length){const l=s.text[d],p=s.text[c];this.activeMainWordIndices.set(i,c);const f=p.timestamp-l.endtime,u=p.endtime-p.timestamp;this.mainWordAnimations.set(i,{startTime:performance.now()+f,duration:u}),e=!0}else this.mainWordAnimations.set(i,{startTime:0,duration:0})}}else this.mainWordProgress.set(i,0),e=!0}const r=this.backgroundWordAnimations.get(i);if(r&&r.duration>0){const a=t-r.startTime;if(a>=0){const o=Math.min(1,a/r.duration);if(this.backgroundWordProgress.set(i,o),o<1)e=!0;else{const d=this.activeBackgroundWordIndices.get(i)??-1;if(s.backgroundText&&d!==-1&&d<s.backgroundText.length-1){const c=d+1,l=s.backgroundText[d],p=s.backgroundText[c];this.activeBackgroundWordIndices.set(i,c);const f=p.timestamp-l.endtime,u=p.endtime-p.timestamp;this.backgroundWordAnimations.set(i,{startTime:performance.now()+f,duration:u}),e=!0}else this.backgroundWordAnimations.set(i,{startTime:0,duration:0})}}else this.backgroundWordProgress.set(i,0),e=!0}}e?this.animationFrameId=requestAnimationFrame(this._boundAnimateProgress):this.animationFrameId&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=void 0)}generateLRC(){if(!this.lyrics)return"";let t="";this.songTitle&&(t+=`[ti:${this.songTitle}]
`),this.songArtist&&(t+=`[ar:${this.songArtist}]
`),this.songAlbum&&(t+=`[al:${this.songAlbum}]
`),this.lyricsSource&&(t+=`[re:${this.lyricsSource}]
`);for(const e of this.lyrics)if(e.text&&e.text.length>0){const i=h.formatTimestampLRC(e.timestamp),s=e.text.map(n=>n.text).join("").trim();t+=`[${i}]${s}
`}return t}generateTTML(){if(!this.lyrics)return"";let t=`<?xml version="1.0" encoding="UTF-8"?>
`;t+=`<tt xmlns="http://www.w3.org/ns/ttml" xmlns:itunes="http://music.apple.com/lyrics">
`,t+=`  <body>
`;let e;for(let i=0;i<this.lyrics.length;i+=1){const s=this.lyrics[i],n=s.songPart;(n!==e||i===0)&&(i>0&&(t+=`    </div>
`),e=n,e?t+=`    <div itunes:song-part="${e}">
`:t+=`    <div>
`);const r=h.formatTimestampTTML(s.timestamp),a=h.formatTimestampTTML(s.endtime);t+=`      <p begin="${r}" end="${a}">
`;for(const o of s.text){const d=h.formatTimestampTTML(o.timestamp),c=h.formatTimestampTTML(o.endtime),l=o.text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");t+=`        <span begin="${d}" end="${c}">${l}</span>
`}t+=`      </p>
`}return this.lyrics.length>0&&(t+=`    </div>
`),t+=`  </body>
`,t+="</tt>",t}static formatTimestampLRC(t){const e=t/1e3,i=Math.floor(e/60),s=Math.floor(e%60),n=Math.floor(t%1e3/10),r=a=>a.toString().padStart(2,"0");return`${r(i)}:${r(s)}.${r(n)}`}static formatTimestampTTML(t){const e=t/1e3,i=Math.floor(e/3600),s=Math.floor(e%3600/60),n=Math.floor(e%60),r=Math.floor(t%1e3),a=(o,d=2)=>o.toString().padStart(d,"0");return`${a(i)}:${a(s)}:${a(n)}.${a(r,3)}`}downloadLyrics(){if(!this.lyrics||this.lyrics.length===0)return;const t=this.lyrics.some(d=>d.isWordSynced!==!1);let e="",i=this.downloadFormat;i==="auto"&&(i=t?"ttml":"lrc");let s="";if(i==="ttml"?(e=this.generateTTML(),s="application/xml"):(e=this.generateLRC(),s="text/plain"),!e)return;const n=new Blob([e],{type:s}),r=URL.createObjectURL(n),a=document.createElement("a");a.href=r;const o=this.songTitle?`${this.songTitle}${this.songArtist?` - ${this.songArtist}`:""}.${i}`:`lyrics.${i}`;a.download=o,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(r)}render(){this.fontFamily&&(this.style.fontFamily=this.fontFamily),this.style.setProperty("--highlight-color",this.highlightColor);const t=this.lyricsSource??"Unavailable",e=this.cachedIsUnsynced,i=()=>{if(this.isLoading)return O`
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        `;if(!this.lyrics||this.lyrics.length===0)return O`<div class="no-lyrics">No lyrics found.</div>`;const s=this.findAllInstrumentalGaps(),n=new Map(s.map(r=>[r.insertBeforeIndex,r]));return this.lyrics.map((r,a)=>{const o=`lyrics-line-${a}`,d=r.text[0]?.timestamp||0,c=r.text[r.text.length-1]?.endtime||0,l=r.backgroundText&&r.backgroundText.length>0,p=l?O`<p class="background-vocal-container">
              <span class="background-vocal-wrap">
                ${r.backgroundText.map((A,I)=>{const z=A.timestamp,W=A.endtime,D=W-z,q=this.showRomanization&&A.romanizedText&&A.romanizedText.trim()!==A.text.trim()?O`<span
                          class="lyrics-syllable transliteration no-chars ${A.lineSynced?"line-synced":""}"
                          data-start-time="${z}"
                          data-end-time="${W}"
                          data-duration="${D}"
                          data-syllable-index="0"
                          data-wipe-ratio="1"
                          >${A.romanizedText}</span
                        >`:"";return O`<span class="lyrics-word"
                    ><span
                      class="lyrics-syllable-wrap${q?" has-transliteration":""}"
                      ><span
                        class="lyrics-syllable no-chars${A.lineSynced?" line-synced":""}"
                        data-start-time="${z}"
                        data-end-time="${W}"
                        data-duration="${D}"
                        data-syllable-index="${I}"
                        data-word-index="${I}"
                        data-word-length="${A.text.replace(/\s/g,"").length}"
                        data-wipe-ratio="1"
                        >${A.text}</span
                      >${q}</span
                    ></span
                  >`})}
              </span>
            </p>`:"",f=l?h.getBackgroundTextPlacement(r):"after",u=this.cachedLineData?.[a],g=u?.wordGroups??[],b=u?.groupGrowable??[],y=u?.groupGlowing??[],x=u?.groupCharRise??[],S=u?.groupCharDrag??[],w=u?.vwFullText??[],P=u?.vwFullDuration??[],F=u?.vwCharOffset??[],L=u?.vwStartMs??[],v=u?.vwEndMs??[],E=u?.lineIsRTL??!1,T=O`<p
          class="main-vocal-container ${E?"rtl-text":""}"
        >
          ${g.map((A,I)=>{const z=b[I],W=y[I],D=x[I],q=S[I],j=z||D||q,ht=A.some(H=>H.lineSynced),Ft=j?w[I]:"",G=j?P[I]:0,N=Ft.replace(/\s/g,"").length,ut=j?F[I]:0,zt=`${a}:${L[I]}:${v[I]}`,Dt=L[I],gi=v[I];let pe=0;const Ot=A.map(H=>H.text).join(""),fi=Ot.replace(/\s/g,"").length,yi=Ot.trim().length>=16||/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(Ot),bi=A[0].timestamp,vi=A[A.length-1].endtime-bi,xi=Math.max(1.2,Math.min(2.5,1.2+vi/1e3*.6));return O`<span
              class="lyrics-word${z?" growable":""}${D?" char-rise":""}${q?" char-drag":""}${W?" glowing":""}${yi?" allow-break":""}"
              data-virtual-word-id="${zt}"
              data-virtual-word-start="${Dt}"
              data-virtual-word-end="${gi}"
              style="--rise-duration: ${xi}s"
              >${A.map((H,wi)=>{const $t=H.timestamp,Ut=H.endtime,At=Ut-$t,Nt=H.text||"",me=this.showRomanization&&H.romanizedText&&H.romanizedText.trim()!==H.text.trim()?O`<span
                        class="lyrics-syllable transliteration no-chars ${ht?"line-synced":""}"
                        data-start-time="${$t}"
                        data-end-time="${Ut}"
                        data-duration="${At}"
                        data-syllable-index="0"
                        data-wipe-ratio="1"
                        >${H.romanizedText}</span
                      >`:"";let ge=Nt;if(j){const fe=Nt.replace(/\s/g,"").length||1,ye=G>0&&Number.isFinite(Dt),Si=ye?h.clamp(($t-Dt)/G,0,1):0,be=ye?h.clamp(At/G,0,1):1;let ve=0;ge=O`${Nt.split("").map(xe=>{if(xe===" ")return" ";const wt=ut+pe,Ti=ve,we=Math.max(1,N),ki=h.clamp(Si+Ti/fe*be,0,1),Ei=be/fe||1/we;pe+=1,ve+=1;const Se=400,$i=Math.min(1,Math.max(0,(G-Se)/(3e3-Se)))**3,Te=N>5,Bt=G<1200;let ke=0;if(Te||Bt){let Ct=0;Te&&(Ct+=Math.min((N-5)/5,1)*.4),Bt&&N>3?Ct+=Math.max(0,1-(G-800)/400)*.3:Bt&&N<=3&&(Ct+=Math.max(0,1-(G-800)/400)*.1),ke=Math.min(Ct,.7)}const Ai=1-(N>1?wt/(N-1):0)*ke,Ee=$i*Ai,Lt=1+(N<=3?.05:.04)+Ee*.08,Li=Math.min(1.1,G/1500);let Gt=1;N<=3?Gt=.85:N>=6&&(Gt=1.1);const Ci=Li*Gt,Ii=W?(.35+Ee*.45)*Ci:0,Wi=(Lt-1)/.1,Pi=(G+At*2)/3,Mi=Math.min(1,Math.max(.3,Pi/2e3)),_i=-Wi*(2*Mi),$e=((wt+.5)/N-.5)*2*((Lt-1)*25),Ae=q;let qt=_i;D?qt=0:Ae&&(qt=-.78);let Ht=$e;return(D||Ae)&&(Ht=0),O`<span
                      class="char"
                      data-char-index="${wt}"
                      data-syllable-char-index="${wt}"
                      data-wipe-start="${ki.toFixed(4)}"
                      data-wipe-duration="${Ei.toFixed(4)}"
                      data-horizontal-offset="${$e.toFixed(2)}"
                      data-max-scale="${Lt.toFixed(3)}"
                      data-matrix-scale="${(Lt*.98).toFixed(3)}"
                      data-char-offset-x="${(Ht*.98).toFixed(2)}"
                      data-shadow-intensity="${Ii.toFixed(3)}"
                      data-translate-y-peak="${qt.toFixed(3)}"
                      style="--word-wipe-width: ${we}ch; --char-wipe-position: -${wt}ch"
                      >${xe}</span
                    >`})}`}return O`<span
                  class="lyrics-syllable-wrap${me?" has-transliteration":""}"
                  ><span
                    class="lyrics-syllable${ht?" line-synced":""}${j?" has-chars":" no-chars"}"
                    data-start-time="${$t}"
                    data-end-time="${Ut}"
                    data-duration="${At}"
                    data-word-duration="${G}"
                    data-syllable-index="${wi}"
                    data-word-index="${I}"
                    data-word-length="${fi}"
                    data-wipe-ratio="1"
                    >${ge}</span
                  >${me}</span
                >`})}</span
            >`})}
        </p>`,k=r.text.map(A=>A.text).join("").trim(),_=this.showTranslation&&r.translation&&r.translation.trim()!==k?O`<div class="lyrics-translation-container">
                ${r.translation}
              </div>`:"",$=this.showRomanization&&r.romanizedText&&!r.text.some(A=>A.romanizedText)&&r.romanizedText.trim()!==k?O`<div
                class="lyrics-romanization-container ${E?"rtl-text":""}"
              >
                ${r.romanizedText}
              </div>`:"";let C=null;const M=n.get(a);if(M){const A=M.gapEnd-M.gapStart,I=A/3,z=h.getGapLoopDelay(A);C=O`<div
            id="gap-${a}"
            class="lyrics-line lyrics-gap"
            data-start-time="${M.gapStart}"
            data-end-time="${M.gapEnd}"
            style="--gap-pulse-duration: ${Rt}ms; --gap-loop-delay: -${z}ms; --gap-exit-duration: ${dt}ms; --gap-exit-scale: ${ri};"
          >
            <p class="main-vocal-container">
              <span class="lyrics-word"
                ><span class="lyrics-syllable-wrap"
                  ><span
                    class="lyrics-syllable"
                    data-start-time="${M.gapStart}"
                    data-end-time="${M.gapStart+I}"
                    data-duration="${I}"
                    data-wipe-ratio="1"
                    data-syllable-index="0"
                  ></span></span
                ><span class="lyrics-syllable-wrap"
                  ><span
                    class="lyrics-syllable"
                    data-start-time="${M.gapStart+I}"
                    data-end-time="${M.gapStart+I*2}"
                    data-duration="${I}"
                    data-wipe-ratio="1"
                    data-syllable-index="1"
                  ></span></span
                ><span class="lyrics-syllable-wrap"
                  ><span
                    class="lyrics-syllable"
                    data-start-time="${M.gapStart+I*2}"
                    data-end-time="${M.gapEnd}"
                    data-duration="${I}"
                    data-wipe-ratio="1"
                    data-syllable-index="2"
                  ></span></span
              ></span>
            </p>
          </div>`}return O`
          ${C}
          <div
            id="${o}"
            class="lyrics-line ${r.alignment==="end"?"singer-right":"singer-left"} ${E?"rtl-text":""}"
            data-start-time="${d}"
            data-end-time="${c}"
            @click=${()=>this.handleLineClick(r)}
            tabindex="0"
            @keydown=${A=>{(A.key==="Enter"||A.key===" ")&&this.handleLineClick(r)}}
          >
            <div class="lyrics-line-container ${E?"rtl-text":""}">
              ${f==="before"?p:""}
              ${T}
              ${f==="after"?p:""}
              ${$} ${_}
            </div>
          </div>
        `})};return O`
      <div
        class="lyrics-container ${e?"is-unsynced":"blur-inactive-enabled"}"
      >
        ${!this.isLoading&&this.lyrics&&this.lyrics.length>0?O`
              <div class="lyrics-header">
                <div class="header-controls">
                  <button
                    class="download-button ${this.showRomanization?"active":""}"
                    @click=${this.toggleRomanization}
                    title="Toggle Romanization"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-speech-icon lucide-speech"
                    >
                      <path
                        d="M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.054 1 4.55a5.77 5.77 0 0 1 .029 2.758L2 20"
                      />
                      <path d="M19.8 17.8a7.5 7.5 0 0 0 .003-10.603" />
                      <path d="M17 15a3.5 3.5 0 0 0-.025-4.975" />
                    </svg>
                  </button>
                  <button
                    class="download-button ${this.showTranslation?"active":""}"
                    @click=${this.toggleTranslation}
                    title="Toggle Translation"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-languages-icon lucide-languages"
                    >
                      <path d="m5 8 6 6" />
                      <path d="m4 14 6-6 2-3" />
                      <path d="M2 5h12" />
                      <path d="M7 2h1" />
                      <path d="m22 22-5-10-5 10" />
                      <path d="M14 18h6" />
                    </svg>
                  </button>
                </div>
                <div class="download-controls">
                  <select
                    class="format-select"
                    @change=${s=>{this.downloadFormat=s.target.value}}
                    .value=${this.downloadFormat}
                    @click=${s=>s.stopPropagation()}
                  >
                    <option value="auto">Auto</option>
                    <option value="lrc">LRC</option>
                    <option value="ttml">TTML</option>
                  </select>
                  <button
                    class="download-button"
                    @click=${this.downloadLyrics}
                    title="Download Lyrics"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-download-icon lucide-download"
                    >
                      <path d="M12 15V3" />
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="m7 10 5 5 5-5" />
                    </svg>
                  </button>
                </div>
              </div>
            `:""}
        ${i()}
        ${this.isLoading?"":O`
              <footer class="lyrics-footer lyrics-line">
                <div class="footer-content">
                  <span
                    class="source-info"
                    style="display: flex; align-items: center; gap: 8px;"
                  >
                    <b style="font-weight: 750;">Source</b> ${t}
                    ${this.availableSources&&this.availableSources.length>1||!this.hasFetchedAllProviders?O`
                          <button
                            class="download-button source-switch-btn"
                            title="Switch Lyrics Source"
                            @click=${this.switchSource}
                            ?disabled=${this.isFetchingAlternatives}
                          >
                            <svg
                              class="source-switch-svg lucide lucide-arrow-down-up-icon lucide-arrow-down-up ${this.isFetchingAlternatives?"is-loading":""}"
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              ${this.isFetchingAlternatives?re`<path
                                    d="M21 12a9 9 0 1 1-6.219-8.56"
                                  ></path>`:re`<path d="m3 16 4 4 4-4"></path
                                    ><path d="M7 20V4"></path
                                    ><path d="m21 8-4-4-4 4"></path
                                    ><path d="M17 4v16"></path>`}
                            </svg>
                            <span class="source-switch-label"
                              >${this.isFetchingAlternatives?"Switching...":"Switch"}</span
                            >
                          </button>
                        `:""}
                  </span>
                  ${this.songwriters?O`<span
                        class="songwriters-info"
                        style="margin-top: 4px; font-weight: normal; font-size: 0.9em;"
                      >
                        <b style="font-weight: 750;">Songwriters</b> ${this.songwriters}
                      </span>`:""}
                  <span class="version-info" style="margin-top: 8px;">
                    <b style="font-weight: 750;">am-lyrics</b> v${le} •

                    <a
                      href="https://github.com/uimaxbai/apple-music-web-components"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="display: inline-flex; align-items: center; gap: 4px;"
                      >Star me on GitHub
                    </a>
                  </span>
                </div>
              </footer>
            `}
      </div>
    `}}return h.styles=Pe`
    :host {
      --lyplus-lyrics-palette: var(
        --am-lyrics-highlight-color,
        var(--highlight-color, #ffffff)
      );
      --lyplus-text-primary: var(--lyplus-lyrics-palette);
      /* Use color-mix with the text color rather than just opacity so it adapts */
      --lyplus-text-secondary: color-mix(
        in srgb,
        var(--lyplus-lyrics-palette),
        transparent 45%
      );

      --lyplus-padding-base: 1em;
      --lyplus-padding-line: 10px;
      --lyplus-padding-gap: 0.3em;
      --lyplus-border-radius-base: 0.6em;
      --lyplus-gap-dot-size: 0.4em;
      --lyplus-gap-dot-margin: 0.08em;

      --lyplus-font-size-base: 32px;
      --lyplus-font-size-base-grow: 24.5;
      --lyplus-font-size-subtext: 0.6em;
      --char-rise-y: calc(-0.035 * var(--lyplus-font-size-base));

      --lyplus-blur-amount: 0.07em;
      --lyplus-blur-amount-near: 0.035em;
      --lyplus-fade-gap-timing-function: ease-out;
      --wipe-gradient-width: 0.75em;
      --wipe-gradient-half: 0.375em;

      --lyrics-scroll-padding-top: 25%;

      display: block;
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
        Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background: transparent;
      height: 100%;
      overflow: hidden;
      font-weight: bold;
      color: var(--lyplus-text-primary);
    }

    /* ==========================================================================
       CONTAINER & SCROLL BEHAVIOR
       ========================================================================== */
    .lyrics-container {
      padding: 20px;
      padding-top: 80px;
      border-radius: 8px;
      background-color: transparent;
      width: 100%;
      height: 100%;
      max-height: 100vh;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      box-sizing: border-box;
      scrollbar-width: none;
      overflow-anchor: none;
    }

    .lyrics-container::-webkit-scrollbar {
      display: none;
    }

    /* Disable transitions during touch-scrolling for 1:1 feedback */
    .lyrics-container.touch-scrolling .lyrics-line,
    .lyrics-container.touch-scrolling .lyrics-plus-metadata {
      transition: none !important;
      filter: none !important;
    }

    /* Apply smooth gliding transition for mouse-wheel scrolling */
    .lyrics-container.wheel-scrolling .lyrics-line {
      transition: transform 0.3s ease-out !important;
      filter: none !important;
    }

    .lyrics-line.scroll-animate {
      /* Preserve the graceful fade duration; the keyframe handles the
         transform, so we only need to keep opacity/filter transitions
         alive without !important overriding the base rule. */
      transition:
        opacity 0.7s ease,
        filter 0.7s ease,
        transform 0.4s cubic-bezier(0.41, 0, 0.12, 0.99)
          var(--lyrics-line-delay, 0ms);
      animation-name: lyrics-scroll;
      animation-duration: var(--scroll-duration, 400ms);
      animation-timing-function: cubic-bezier(0.41, 0, 0.12, 0.99);
      animation-fill-mode: both;
      animation-delay: var(--lyrics-line-delay, 0ms);
    }

    .lyrics-container.user-scrolling .lyrics-line {
      --lyrics-line-delay: 0ms !important;
      transition-delay: 0ms !important;
    }

    /* ==========================================================================
       LYRICS LINE BASE STYLES
       ========================================================================== */
    .lyrics-line {
      padding: var(--lyplus-padding-line);
      opacity: 0.8;
      color: var(--lyplus-text-secondary);
      font-size: var(--lyplus-font-size-base);
      cursor: pointer;
      transform-origin: left;
      /* Graceful 0.7 s fade so the line stays mostly bright while the
         0.4 s scroll animation runs, then settles into the inactive state. */
      transition:
        opacity 0.7s ease,
        transform 0.4s cubic-bezier(0.41, 0, 0.12, 0.99)
          var(--lyrics-line-delay, 0ms),
        filter 0.7s ease;
      content-visibility: auto;
      contain: layout style;
      text-rendering: optimizeLegibility;
    }

    .lyrics-line:not(.scroll-animate) {
      animation: none;
    }

    /* --- Line Container & Vocal Containers --- */
    .lyrics-line-container {
      overflow-wrap: break-word;
      transform-origin: left;
      transform: translateZ(0);
      transition:
        transform 0.7s ease,
        background-color 0.7s,
        color 0.7s;
    }

    .lyrics-line.active .lyrics-line-container,
    .lyrics-line.pre-active .lyrics-line-container {
      transform: translateZ(0);
      transition:
        transform 0.5s ease,
        background-color 0.18s,
        color 0.18s;
    }

    .main-vocal-container {
      transform-origin: 5% 50%;
      margin: 0;
    }

    .background-vocal-container {
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      font-size: var(--lyplus-font-size-subtext);
      line-height: 1.15;
      color: color-mix(in srgb, var(--lyplus-text-secondary) 80%, transparent);
      transition:
        max-height var(--scroll-duration, 400ms)
          cubic-bezier(0.41, 0, 0.12, 0.99),
        opacity var(--scroll-duration, 400ms) cubic-bezier(0.41, 0, 0.12, 0.99);
      margin: 0;
      pointer-events: none;
    }

    .background-vocal-wrap {
      display: block;
      padding-top: 0;
      padding-bottom: 0;
      transition: padding-top var(--scroll-duration, 400ms)
        cubic-bezier(0.41, 0, 0.12, 0.99);
    }

    .lyrics-line.singer-right .background-vocal-container,
    .lyrics-line.rtl-text .background-vocal-container {
      margin-left: auto;
      margin-right: 0;
    }

    /* Background vocals expand only when .bg-expanded is present.
       This is separate from .active so bg vocals can collapse immediately
       while .active stays to keep text white until the scroll passes. */
    .lyrics-line.bg-expanded .background-vocal-container {
      max-height: 4em;
      opacity: 1;
      will-change: opacity;
    }

    .lyrics-line.bg-expanded .background-vocal-wrap {
      padding-top: 0.26em;
    }

    /* --- Line States & Modifiers --- */
    .lyrics-line.active {
      opacity: 1;
      color: var(--lyplus-text-primary);
    }

    .lyrics-line.pre-active {
      opacity: 1;
    }

    .lyrics-line.persist-highlight {
      filter: none !important;
      opacity: 1;
    }

    .lyrics-line.persist-highlight .lyrics-syllable.finished,
    .lyrics-line.persist-highlight .lyrics-syllable.finished span.char {
      transition: none !important;
    }

    .lyrics-line.singer-right {
      text-align: end;
    }

    .lyrics-line.singer-right .lyrics-line-container,
    .lyrics-line.singer-right .main-vocal-container {
      transform-origin: right;
    }

    .lyrics-line.rtl-text {
      direction: rtl;
      text-align: right !important;
      transform-origin: right;
    }

    .lyrics-line.rtl-text .lyrics-line-container,
    .lyrics-line.rtl-text .main-vocal-container {
      transform-origin: right;
    }

    .lyrics-line.rtl-text .lyrics-romanization-container,
    .lyrics-line.rtl-text .lyrics-translation-container {
      text-align: right;
    }

    /* --- Unsynced (Plain Text) Lyrics Overrides --- */
    .lyrics-container.is-unsynced .lyrics-line {
      opacity: 1 !important;
      color: var(--lyplus-text-primary) !important;
      filter: none !important;
      transform: none !important;
      cursor: default;
    }

    .lyrics-container.is-unsynced .lyrics-line-container {
      transform: none !important;
      background-color: transparent !important;
    }

    .lyrics-container.is-unsynced .lyrics-syllable {
      color: var(--lyplus-text-primary) !important;
      background-color: transparent !important;
      -webkit-background-clip: unset !important;
      background-clip: unset !important;
      -webkit-text-fill-color: unset !important;
      text-fill-color: unset !important;
      text-shadow: none !important;
      filter: none !important;
      opacity: 1 !important;
      transform: none !important;
    }

    @media (hover: hover) and (pointer: fine) {
      .lyrics-line:hover {
        filter: none !important;
        opacity: 1 !important;
      }
      .lyrics-container.is-unsynced .lyrics-line:hover {
        background: transparent !important;
      }
    }

    /* --- Blur Effect for Inactive Lines --- */
    .lyrics-container.blur-inactive-enabled:not(.not-focused)
      .lyrics-line:not(.active):not(.pre-active):not(.lyrics-gap):not(
        .persist-highlight
      ) {
      filter: blur(var(--lyplus-blur-amount));
    }

    /* Viewport Virtualization: Strip expensive filters and animations from
       offscreen lines.  IntersectionObserver toggles this class. */
    .lyrics-line.far-line {
      filter: none !important;
      will-change: auto !important;
      animation: none !important;
    }

    .lyrics-container.blur-inactive-enabled:not(.not-focused)
      .lyrics-line.post-active-line:not(.lyrics-gap):not(.active):not(
        .pre-active
      ):not(.persist-highlight),
    .lyrics-container.blur-inactive-enabled:not(.not-focused)
      .lyrics-line.next-active-line:not(.lyrics-gap):not(.active):not(
        .pre-active
      ):not(.persist-highlight),
    .lyrics-container.blur-inactive-enabled:not(.not-focused)
      .lyrics-line.lyrics-activest:not(.active):not(.lyrics-gap):not(
        .pre-active
      ):not(.persist-highlight) {
      filter: blur(var(--lyplus-blur-amount-near));
    }

    /* Unblur all lines when user is scrolling */
    .lyrics-container.user-scrolling .lyrics-line {
      transition: none !important;
      filter: none !important;
      opacity: 0.8 !important;
    }

    /* Unblur early for pre-active lines */
    .lyrics-container.blur-inactive-enabled .lyrics-line.pre-active {
      filter: blur(0px) !important;
      opacity: 1;
    }

    /* ==========================================================================
       WORD & SYLLABLE STYLES
       ========================================================================== */
    .lyrics-word:not(.allow-break) {
      display: inline-block;
      vertical-align: baseline;
      white-space: nowrap;
    }

    .lyrics-word.allow-break {
      display: inline;
    }

    .lyrics-word.char-rise {
      display: inline-block;
      vertical-align: baseline;
      white-space: nowrap;
    }

    .lyrics-word.char-drag {
      display: inline-block;
      vertical-align: baseline;
      white-space: nowrap;
    }

    .lyrics-word.char-rise.allow-break {
      display: inline;
      white-space: normal;
    }

    .lyrics-word.char-drag.allow-break {
      display: inline;
      white-space: normal;
    }

    .lyrics-syllable-wrap {
      display: inline;
    }

    .lyrics-syllable-wrap.has-transliteration {
      display: inline-flex;
      flex-direction: column;
      align-items: start;
    }

    .lyrics-syllable {
      display: inline-block;
      vertical-align: baseline;
      color: transparent;
      background-color: var(--lyplus-text-secondary);
      white-space: pre-wrap;
      font-variant-ligatures: none;
      font-feature-settings: 'liga' 0;
      background-clip: text;
      -webkit-background-clip: text;
      transition:
        color 0.7s,
        background-color 0.7s,
        transform 0.7s ease;
    }

    /* --- Syllable States --- */
    .lyrics-syllable.finished {
      background-color: var(--lyplus-text-primary);
      /* Unified transition: transform keeps its 1s glow decay, while
         background-color and color fade at 0.7s so everything dims
         together when the line becomes inactive. */
      transition:
        transform 1s ease,
        background-color 0.7s ease,
        color 0.7s ease;
    }

    .lyrics-syllable.finished.has-chars {
      background-color: transparent;
    }

    .lyrics-line.active:not(.lyrics-gap) .lyrics-syllable {
      transition:
        transform 1s ease,
        background-color 0.5s,
        color 0.5s;
    }

    /* --- Wipe Highlight Effect --- */
    .lyrics-line.active:not(.lyrics-gap) .lyrics-syllable.highlight.no-chars,
    .lyrics-line.active:not(.lyrics-gap)
      .lyrics-syllable.pre-highlight.no-chars {
      background-repeat: no-repeat;
      background-image: linear-gradient(
        90deg,
        var(--lyplus-text-primary, #fff) 0%,
        var(--lyplus-text-primary, #fff)
          calc(100% - var(--wipe-gradient-width, 0.75em)),
        #0000 100%
      );
      background-size: 0% 100%;
      background-position: left;
    }

    .lyrics-line.active:not(.lyrics-gap) .lyrics-syllable.highlight.rtl-text,
    .lyrics-line.active:not(.lyrics-gap)
      .lyrics-syllable.pre-highlight.rtl-text {
      direction: rtl;
      background-image: linear-gradient(
        -90deg,
        var(--lyplus-text-primary) 0%,
        var(--lyplus-text-primary)
          calc(100% - var(--wipe-gradient-width, 0.75em)),
        transparent 100%
      );
      background-size: 0% 100%;
      background-position: right 0%;
    }

    /* Background vocals: muted gray wipe instead of white.
       Must match specificity of the main .active .highlight rule (0,3,1). */
    .lyrics-line.active
      .background-vocal-container
      .lyrics-syllable.highlight.no-chars,
    .lyrics-line.active
      .background-vocal-container
      .lyrics-syllable.pre-highlight.no-chars,
    .lyrics-line.pre-active
      .background-vocal-container
      .lyrics-syllable.highlight.no-chars,
    .lyrics-line.pre-active
      .background-vocal-container
      .lyrics-syllable.pre-highlight.no-chars {
      background-image: linear-gradient(
        90deg,
        color-mix(in srgb, var(--lyplus-text-primary, #fff) 50%, #888888) 0%,
        color-mix(in srgb, var(--lyplus-text-primary, #fff) 50%, #888888)
          calc(100% - var(--wipe-gradient-width, 0.75em)),
        #0000 100%
      );
    }

    .lyrics-line.active
      .background-vocal-container
      .lyrics-syllable.highlight.rtl-text,
    .lyrics-line.active
      .background-vocal-container
      .lyrics-syllable.pre-highlight.rtl-text,
    .lyrics-line.pre-active
      .background-vocal-container
      .lyrics-syllable.highlight.rtl-text,
    .lyrics-line.pre-active
      .background-vocal-container
      .lyrics-syllable.pre-highlight.rtl-text {
      background-image: linear-gradient(
        -90deg,
        color-mix(in srgb, var(--lyplus-text-primary) 50%, #888888) 0%,
        color-mix(in srgb, var(--lyplus-text-primary) 50%, #888888)
          calc(100% - var(--wipe-gradient-width, 0.75em)),
        transparent 100%
      );
    }

    /* Non-growable words float up with a gentle curve */
    .lyrics-line.active:not(.lyrics-gap)
      .lyrics-word:not(.growable)
      .lyrics-syllable.highlight {
      transform: translate3d(0, var(--char-rise-y, -1.12px), 0);
    }

    .lyrics-line.persist-highlight:not(.lyrics-gap)
      .lyrics-word:not(.growable)
      .lyrics-syllable.finished {
      transform: translate3d(0, var(--char-rise-y, -1.12px), 0);
    }

    .lyrics-word.growable .lyrics-syllable.cleanup .char {
      transform: translate3d(0, var(--char-rise-y, -1.12px), 0);
    }

    .lyrics-word.char-rise .lyrics-syllable.cleanup .char {
      transform: translate3d(0, var(--char-rise-y, -1.12px), 0);
    }

    .lyrics-word.char-drag .lyrics-syllable.cleanup .char {
      transform: translate3d(0, var(--char-rise-y, -1.12px), 0);
    }

    .lyrics-line.persist-highlight
      .lyrics-word.growable
      .lyrics-syllable.finished
      .char,
    .lyrics-line.persist-highlight
      .lyrics-word.char-rise
      .lyrics-syllable.finished
      .char,
    .lyrics-line.persist-highlight
      .lyrics-word.char-drag
      .lyrics-syllable.finished
      .char {
      transform: translate3d(0, var(--char-rise-y, -1.12px), 0);
    }

    /* Background vocal overrides — placed AFTER main rules so they win
       on equal specificity. */
    .background-vocal-container .lyrics-syllable {
      background-color: color-mix(
        in srgb,
        var(--lyplus-text-secondary) 50%,
        #888888
      );
    }

    .lyrics-line.active:not(.lyrics-gap)
      .background-vocal-container
      .lyrics-syllable.finished,
    .lyrics-line.pre-active
      .background-vocal-container
      .lyrics-syllable.finished {
      background-color: color-mix(
        in srgb,
        var(--lyplus-text-primary) 50%,
        #888888
      );
    }

    .background-vocal-container .lyrics-syllable.line-synced {
      color: color-mix(
        in srgb,
        var(--lyplus-text-secondary) 50%,
        #888888
      ) !important;
    }

    .lyrics-line.active:not(.lyrics-gap)
      .background-vocal-container
      .lyrics-syllable.line-synced,
    .lyrics-line.pre-active
      .background-vocal-container
      .lyrics-syllable.line-synced {
      color: color-mix(
        in srgb,
        var(--lyplus-text-primary) 50%,
        #888888
      ) !important;
    }

    .lyrics-line.active:not(.lyrics-gap)
      .background-vocal-container
      .lyrics-syllable.line-synced.finished,
    .lyrics-line.pre-active
      .background-vocal-container
      .lyrics-syllable.line-synced.finished {
      color: color-mix(
        in srgb,
        var(--lyplus-text-primary) 50%,
        #888888
      ) !important;
    }

    .lyrics-syllable.pre-highlight {
      animation-name: pre-wipe-universal;
      animation-duration: var(--pre-wipe-duration);
      animation-delay: var(--pre-wipe-delay);
      animation-timing-function: linear;
      animation-fill-mode: forwards;
    }

    .lyrics-syllable.pre-highlight.rtl-text {
      animation-name: pre-wipe-universal-rtl;
    }

    .lyrics-syllable.transliteration {
      font-size: var(--lyplus-font-size-subtext);
      white-space: pre-wrap;
      pointer-events: none;
      user-select: none;
    }

    /* Syllable with chars: make syllable transparent, chars handle color */
    .lyrics-line .lyrics-syllable.has-chars:not(.finished) {
      background-color: transparent;
      color: transparent;
    }

    .lyrics-syllable span.char {
      display: inline-block;
      background-color: var(--lyplus-text-secondary);
      white-space: break-spaces;
      font-variant-ligatures: none;
      font-feature-settings: 'liga' 0;
      background-clip: text;
      -webkit-background-clip: text;
      backface-visibility: hidden;
      transform-origin: 50% 80%;
      transition:
        color 0.7s,
        background-color 0.7s,
        transform 0.7s ease;
    }

    .lyrics-syllable.finished span.char {
      background-color: var(--lyplus-text-primary);
      transition:
        color 0.7s,
        background-color 0.7s,
        transform 0.7s ease;
    }

    .lyrics-word.char-drag span.char {
      transition: color 0.18s;
    }

    /* Active char spans: structural only, wipe animation sets gradient */
    .lyrics-line.active .lyrics-syllable span.char {
      background-clip: text;
      -webkit-background-clip: text;
      background-repeat: no-repeat;
      background-image: linear-gradient(
        90deg,
        var(--lyplus-text-primary, #fff) 0%,
        var(--lyplus-text-primary, #fff)
          calc(100% - var(--wipe-gradient-width, 0.75em)),
        #0000 100%
      );
      background-size: 0% 100%;
      background-position: left;
      transition:
        transform 0.7s ease,
        color 0.18s;
    }

    .lyrics-line.active .lyrics-syllable span.char.highlight {
      background-image: linear-gradient(
        -90deg,
        var(--lyplus-text-primary, #fff) 0%,
        var(--lyplus-text-primary, #fff)
          calc(100% - var(--wipe-gradient-width, 0.75em)),
        #0000 100%
      );
      background-size: 0% 100%;
      background-position: right 0%;
    }

    .lyrics-line.active .lyrics-syllable span.char.pre-wipe-lead {
      animation-name: pre-wipe-word-char;
      animation-duration: var(--pre-wipe-duration);
      animation-delay: var(--pre-wipe-delay);
      animation-timing-function: linear;
      animation-fill-mode: forwards;
      background-image: linear-gradient(
        90deg,
        var(--lyplus-text-primary, #fff) 0%,
        var(--lyplus-text-primary, #fff)
          calc(100% - var(--wipe-gradient-width, 0.75em)),
        #0000 100%
      );
      background-size: 0% 100%;
      background-position: var(--char-wipe-position, left) 0%;
    }

    /* ==========================================================================
       INSTRUMENTAL GAP STYLES
       ========================================================================== */
    .lyrics-gap {
      max-height: 1.6em;
      padding: var(--lyplus-padding-gap);
      overflow: visible;
      opacity: 0;
      box-sizing: content-box;
      background-clip: unset;
      transform-origin: top;
      content-visibility: visible !important;
      contain: none !important;
      transition:
        opacity 160ms ease-out,
        transform var(--scroll-duration, 280ms) var(--lyrics-line-delay, 0ms);
    }

    .lyrics-gap.active {
      opacity: 1;
      transition:
        opacity 160ms ease-out,
        transform var(--scroll-duration, 280ms);
    }

    /* Exiting state: quickly collapse width and height so dots don't distort page, or remove max-height transition */
    .lyrics-gap.gap-exiting {
      opacity: 1;
    }

    .lyrics-gap .main-vocal-container {
      transform: translateY(-25%) scale(1);
      transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .lyrics-gap:not(.active):not(.gap-exiting) .main-vocal-container {
      transform: translateY(-25%) scale(0);
    }

    /* Pulse — must come BEFORE .gap-exiting so exiting wins via specificity+order */
    .lyrics-gap.active .main-vocal-container {
      animation: gap-loop var(--gap-pulse-duration, 4000ms) ease-in-out infinite
        alternate;
      animation-delay: var(--gap-loop-delay, 0ms);
    }

    /* Jump animation plays during exit — disable transition so animation wins.
       Placed AFTER .active so it wins when both classes are present briefly. */
    .lyrics-gap.gap-exiting .main-vocal-container {
      animation: gap-ended var(--gap-exit-duration, 360ms)
        cubic-bezier(0.33, 1, 0.68, 1) forwards;
      transition: none !important;
    }

    .lyrics-gap .lyrics-syllable {
      display: inline-block;
      width: var(--lyplus-gap-dot-size);
      height: var(--lyplus-gap-dot-size);
      background-color: var(--lyplus-text-primary);
      border-radius: 50%;
      margin: 0 var(--lyplus-gap-dot-margin);
    }

    /* Line-synced lyrics should fade in instantly/quickly instead of wiping */
    .lyrics-syllable.line-synced {
      background: transparent !important;
      color: var(--lyplus-text-secondary) !important;
    }

    .lyrics-line.active .lyrics-syllable.line-synced {
      animation: fade-in-line 0.2s ease-out forwards !important;
      color: var(--lyplus-text-primary) !important;
    }

    .lyrics-line.active .lyrics-syllable.line-synced span.char {
      background-image: none !important;
      background-color: var(--lyplus-text-primary) !important;
      transition: background-color 120ms ease-out !important;
    }

    @keyframes fade-in-line {
      from {
        opacity: 0.5;
        color: var(--lyplus-text-secondary);
      }
      to {
        opacity: 1;
        color: var(--lyplus-lyrics-palette);
      }
    }

    .lyrics-gap .lyrics-syllable {
      background-color: var(--lyplus-text-secondary);
      background-clip: unset;
    }

    .lyrics-gap.active .lyrics-syllable.finished,
    .lyrics-gap.gap-exiting .lyrics-syllable.finished,
    .lyrics-gap:not(.active):not(.gap-exiting).post-active-line
      .lyrics-syllable,
    .lyrics-gap:not(.active):not(.gap-exiting).lyrics-activest
      .lyrics-syllable {
      background-color: var(--lyplus-text-primary);
      animation: none !important;
      opacity: 1;
    }

    /* ==========================================================================
       METADATA & FOOTER STYLES
       ========================================================================== */
    .lyrics-plus-metadata {
      display: block;
      position: relative;
      box-sizing: border-box;
      font-weight: normal;
      transform: translateY(var(--lyrics-scroll-offset, 0px));
      transition:
        opacity 0.3s ease,
        transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)
          var(--lyrics-line-delay, 0ms),
        filter 0.3s ease;
    }

    .lyrics-plus-empty {
      display: block;
      height: 100vh;
      transform: translateY(var(--lyrics-scroll-offset, 0px));
    }

    .lyrics-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      text-align: left;
      font-size: calc(var(--lyplus-font-size-base) * 0.5);
      color: var(--lyplus-text-secondary);
      padding: 20px 0 50vh 0;
      margin-top: 10px;
      font-weight: 400;
      opacity: 0.8;
      transition:
        opacity 0.3s ease,
        transform 0.5s cubic-bezier(0.41, 0, 0.12, 0.99),
        filter 0.3s ease;
      transform-origin: left;
    }

    .lyrics-footer.lyrics-line {
      font-size: calc(var(--lyplus-font-size-base) * 0.5);
      padding: 20px var(--lyplus-padding-line) 50vh var(--lyplus-padding-line);
      margin-top: 0;
    }

    .lyrics-footer.active {
      opacity: 1;
      color: rgba(255, 255, 255, 0.5); /* Grey instead of primary */
    }

    .lyrics-footer.scroll-animate {
      transition: none !important;
      animation-name: lyrics-scroll;
      animation-duration: var(--scroll-duration, 280ms);
      animation-timing-function: cubic-bezier(0.41, 0, 0.12, 0.99);
      animation-fill-mode: both;
      animation-delay: var(--lyrics-line-delay, 0ms);
    }

    .lyrics-container.blur-inactive-enabled:not(.not-focused)
      .lyrics-footer:not(.active) {
      filter: blur(var(--lyplus-blur-amount));
      opacity: 0.5;
    }

    .lyrics-container.user-scrolling .lyrics-footer {
      transition: none !important;
      filter: none !important;
      opacity: 0.8 !important;
    }

    .lyrics-footer p {
      margin: 5px 0;
    }

    .lyrics-footer a {
      color: var(--lyplus-text-primary); /* Stand out using primary color */
      text-underline-offset: 2px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .lyrics-footer a:hover {
      opacity: 1;
    }

    .footer-content {
      display: flex;
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }

    .footer-controls {
      display: flex;
      align-items: center;
    }

    /* ==========================================================================
       HEADER & CONTROLS
       ========================================================================== */
    .lyrics-header {
      display: flex;
      padding: 10px 0;
      margin-bottom: 10px;
      gap: 10px;
      justify-content: space-between;
      align-items: center;
    }

    .lyrics-header .download-button {
      background: none;
      border: none;
      cursor: pointer;
      color: #aaa;
      padding: 0;
      margin-left: 10px;
      vertical-align: middle;
      display: inline-flex;
      align-items: center;
      font-family: inherit;
    }

    .lyrics-header .download-button:hover {
      color: rgba(255, 255, 255, 0.9);
    }

    .header-controls {
      display: flex;
      gap: 8px;
    }

    .download-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .source-switch-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      min-height: 28px;
      background: transparent;
      border-radius: 6px;
      color: #aaa;
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      transition:
        color 0.2s ease,
        border-color 0.2s ease,
        background-color 0.2s ease,
        transform 0.12s ease;
    }

    .source-switch-btn::before {
      content: '';
      position: absolute;
      inset: -6px;
    }

    .source-switch-btn:active:not(:disabled) {
      transform: scale(0.96);
    }

    .source-switch-btn:disabled {
      cursor: default;
      opacity: 0.7;
    }

    .source-switch-svg {
      margin-right: 4px;
    }

    .source-switch-svg.is-loading {
      animation: source-switch-spin 1s linear infinite;
    }

    .control-button {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 0.8em;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition:
        color 0.2s,
        border-color 0.2s,
        background-color 0.2s;
      font-weight: normal;
    }

    .control-button:hover {
      color: rgba(255, 255, 255, 0.9);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .control-button.active {
      background-color: var(--lyplus-text-primary);
      border-color: var(--lyplus-text-primary);
      color: #000;
    }

    .format-select {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.8em;
      margin-left: 10px;
      padding: 2px 5px;
      cursor: pointer;
      font-weight: normal;
      font-family: inherit;
    }

    .format-select:hover {
      color: rgba(255, 255, 255, 0.9);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .format-select option {
      background: #1a1a1a;
      color: #fff;
    }

    /* ==========================================================================
       TRANSLATION & ROMANIZATION
       ========================================================================== */
    .lyrics-translation-container,
    .lyrics-romanization-container {
      padding-top: 0.2em;
      opacity: 0.8;
      font-size: var(--lyplus-font-size-subtext);
      overflow-wrap: break-word;
      pointer-events: none;
      user-select: none;
      transition:
        opacity 0.3s ease,
        color 0.3s;
      font-weight: normal;
    }

    .lyrics-romanization-container {
      direction: ltr !important;
    }

    .lyrics-romanization-container.rtl-text {
      direction: rtl !important;
      text-align: right;
    }

    .lyrics-romanization-container .lyrics-syllable {
      white-space: pre-wrap;
    }

    .lyrics-translation-container {
      opacity: 0.5;
    }

    .main-line-wrapper.small {
      font-size: 0.5em;
      opacity: 0.8;
      display: block;
      margin-bottom: 0px;
    }

    .translation-line {
      font-size: 1em;
      font-weight: bold;
      display: block;
      margin-top: 0px;
      line-height: 1.1;
    }

    .romanized-line {
      font-size: 0.5em;
      color: rgba(255, 255, 255, 0.5);
      display: block;
      margin-top: 2px;
      font-weight: normal;
    }

    /* ==========================================================================
       SKELETON LOADING
       ========================================================================== */
    @keyframes skeleton-loading {
      0% {
        background-color: rgba(255, 255, 255, 0.1);
      }
      100% {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }

    .skeleton-line {
      height: 2.5em;
      margin: 20px 0;
      border-radius: 8px;
      animation: skeleton-loading 1s linear infinite alternate;
      opacity: 0.7;
      width: 60%;
    }

    .skeleton-line:nth-child(even) {
      width: 80%;
    }
    .skeleton-line:nth-child(3n) {
      width: 50%;
    }
    .skeleton-line:nth-child(5n) {
      width: 70%;
    }

    .no-lyrics {
      color: rgba(255, 255, 255, 0.5);
      font-size: 1.2em;
      text-align: center;
      padding: 2em;
      font-weight: normal;
    }

    /* ==========================================================================
       KEYFRAME ANIMATIONS
       ========================================================================== */

    @keyframes source-switch-spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Wipe animation for syllables */
    @keyframes wipe {
      from {
        background-size: 0% 100%;
        background-position: left;
      }
      to {
        background-size: calc(100% + var(--wipe-gradient-width, 0.75em)) 100%;
        background-position: left;
      }
    }

    @keyframes wipe-from-pre {
      from {
        background-size: var(--wipe-gradient-width, 0.75em) 100%;
        background-position: left;
      }
      to {
        background-size: calc(100% + var(--wipe-gradient-width, 0.75em)) 100%;
        background-position: left;
      }
    }

    @keyframes start-wipe {
      0% {
        background-size: 0% 100%;
        background-position: left;
      }
      100% {
        background-size: calc(100% + var(--wipe-gradient-width, 0.75em)) 100%;
        background-position: left;
      }
    }

    @keyframes wipe-rtl {
      from {
        background-size: 0% 100%;
        background-position: right 0%;
      }
      to {
        background-size: calc(100% + var(--wipe-gradient-width, 0.75em)) 100%;
        background-position: right 0%;
      }
    }

    @keyframes wipe-from-pre-rtl {
      from {
        background-size: var(--wipe-gradient-width, 0.75em) 100%;
        background-position: right 0%;
      }
      to {
        background-size: calc(100% + var(--wipe-gradient-width, 0.75em)) 100%;
        background-position: right 0%;
      }
    }

    @keyframes start-wipe-rtl {
      0% {
        background-size: 0% 100%;
        background-position: right 0%;
      }
      100% {
        background-size: calc(100% + var(--wipe-gradient-width, 0.75em)) 100%;
        background-position: right 0%;
      }
    }

    @keyframes pre-wipe-universal {
      from {
        background-size: 0% 100%;
        background-position: left;
      }
      to {
        background-size: var(--wipe-gradient-width, 0.75em) 100%;
        background-position: left;
      }
    }

    @keyframes pre-wipe-universal-rtl {
      from {
        background-size: 0% 100%;
        background-position: right 0%;
      }
      to {
        background-size: var(--wipe-gradient-width, 0.75em) 100%;
        background-position: right 0%;
      }
    }

    @keyframes pre-wipe-word-char {
      from {
        background-size: 0px 100%;
        background-position: var(--char-wipe-position, left) 0%;
      }
      to {
        background-size: var(--pre-wipe-word-size, var(--wipe-gradient-width))
          100%;
        background-position: var(--char-wipe-position, left) 0%;
      }
    }

    @keyframes wipe-word-from-pre {
      from {
        background-size: var(--pre-wipe-word-size, var(--wipe-gradient-width))
          100%;
        background-position: var(--char-wipe-position, left) 0%;
      }
      to {
        background-size: calc(
            var(--word-wipe-width, 100%) + var(--wipe-gradient-width, 0.75em)
          )
          100%;
        background-position: var(--char-wipe-position, left) 0%;
      }
    }

    /* Gap dot animations */
    @keyframes gap-loop {
      from {
        transform: translateY(-25%) scale(1.12);
      }
      to {
        transform: translateY(-25%) scale(var(--gap-exit-scale, 0.85));
      }
    }

    @keyframes gap-ended {
      0% {
        transform: translateY(-25%) scale(var(--gap-exit-scale, 0.85));
      }
      35% {
        transform: translateY(-25%) scale(1.2);
      }
      100% {
        transform: translateY(-25%) scale(0);
      }
    }

    @keyframes fade-gap {
      from {
        background-color: var(--lyplus-text-secondary);
      }
      to {
        background-color: var(--lyplus-text-primary);
      }
    }

    /* Scroll animation — class is removed and re-added (with a forced
       reflow in between) to reliably restart the animation each time */
    @keyframes lyrics-scroll {
      from {
        transform: translate3d(0, var(--scroll-delta), 0);
      }
      to {
        transform: translate3d(0, 0, 0);
      }
    }

    /* Character grow animation — translate3d+scale3d for smooth transform,
       drop-shadow for glow */
    @keyframes grow-dynamic {
      0% {
        transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
        filter: drop-shadow(
          0 0 0
            color-mix(in srgb, var(--lyplus-lyrics-palette), transparent 100%)
        );
      }
      25%,
      30% {
        transform: translate3d(
            var(--char-offset-x, 0px),
            var(--translate-y-peak, -2px),
            0
          )
          scale3d(var(--matrix-scale, 1.1), var(--matrix-scale, 1.1), 1);
        filter: drop-shadow(
          0 0 0.1em
            color-mix(
              in srgb,
              var(--lyplus-lyrics-palette),
              transparent calc((1 - var(--shadow-intensity, 1)) * 100%)
            )
        );
      }
      75%,
      100% {
        transform: translate3d(0, var(--char-rise-y, -1.12px), 0)
          scale3d(1, 1, 1);
        filter: drop-shadow(
          0 0 0
            color-mix(in srgb, var(--lyplus-lyrics-palette), transparent 100%)
        );
      }
    }

    @keyframes rise-char {
      0% {
        transform: translate3d(0, 0, 0);
      }
      65%,
      100% {
        transform: translate3d(0, var(--char-rise-y, -1.12px), 0);
      }
    }

    @keyframes drag-char {
      0% {
        transform: translate3d(0, 0, 0);
      }
      100% {
        transform: translate3d(0, var(--char-rise-y, -1.12px), 0);
      }
    }

    @keyframes grow-static {
      0%,
      100% {
        transform: scale3d(1.01, 1.01, 1.1) translateY(-0.05%);
        text-shadow: 0 0 0
          color-mix(in srgb, var(--lyplus-lyrics-palette), transparent 100%);
      }
      30%,
      40% {
        transform: scale3d(1.1, 1.1, 1.1) translateY(-0.05%);
        text-shadow: 0 0 0.3em
          color-mix(in srgb, var(--lyplus-lyrics-palette), transparent 50%);
      }
    }

    /* Fade in animation */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 0.7;
        transform: translateY(0);
      }
    }

    /* Legacy support */
    .opposite-turn {
      text-align: right;
    }

    .singer-right {
      text-align: right;
      justify-content: flex-end;
    }

    .singer-left {
      text-align: left;
      justify-content: flex-start;
    }

    /* Legacy progress-text for backward compatibility */
    .progress-text {
      position: relative;
      display: inline-block;
      background: linear-gradient(
        to right,
        var(--lyplus-text-primary) 0%,
        var(--lyplus-text-primary) var(--line-progress, 0%),
        var(--lyplus-text-secondary) var(--line-progress, 0%),
        var(--lyplus-text-secondary) 100%
      );
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: var(--lyplus-text-secondary);
      transform: translate3d(0, 0, 0);
      will-change: background-size;
    }

    .progress-text::before {
      display: none;
    }

    .active-line {
      font-weight: bold;
    }

    .background-text {
      display: block;
      color: var(--lyplus-text-secondary);
      font-size: 0.8em;
      font-style: normal;
      margin: 0;
      flex-shrink: 0;
      line-height: 1.1;
    }

    .background-text.before {
      order: -1;
    }

    .background-text.after {
      order: 1;
    }

    .instrumental-line {
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
      color: var(--lyplus-text-secondary);
      font-size: 0.9em;
      padding: 4px 10px;
      animation: fadeInUp 220ms ease;
      font-weight: normal;
    }

    .instrumental-duration {
      color: var(--lyplus-text-secondary);
      font-size: 0.8em;
    }
  `,R([B({type:String})],h.prototype,"query",void 0),R([B({type:String})],h.prototype,"musicId",void 0),R([B({type:String})],h.prototype,"isrc",void 0),R([B({type:String})],h.prototype,"ttml",void 0),R([B({type:String,attribute:"song-title"})],h.prototype,"songTitle",void 0),R([J()],h.prototype,"downloadFormat",void 0),R([B({type:String,attribute:"song-artist"})],h.prototype,"songArtist",void 0),R([B({type:String,attribute:"song-album"})],h.prototype,"songAlbum",void 0),R([B({type:String,attribute:"songwriters"})],h.prototype,"songwriters",void 0),R([B({type:Number,attribute:"song-duration"})],h.prototype,"songDurationMs",void 0),R([B({type:String,attribute:"highlight-color"})],h.prototype,"highlightColor",void 0),R([B({type:String,attribute:"font-family"})],h.prototype,"fontFamily",void 0),R([B({type:Boolean})],h.prototype,"autoScroll",void 0),R([B({type:Boolean})],h.prototype,"interpolate",void 0),R([J()],h.prototype,"showRomanization",void 0),R([J()],h.prototype,"showTranslation",void 0),R([B({type:Number})],h.prototype,"duration",void 0),R([B({type:Number,attribute:"currenttime",hasChanged:()=>!1})],h.prototype,"currentTime",null),R([J()],h.prototype,"isLoading",void 0),R([J()],h.prototype,"lyrics",void 0),R([J()],h.prototype,"lyricsSource",void 0),R([J()],h.prototype,"availableSources",void 0),R([J()],h.prototype,"currentSourceIndex",void 0),R([ii(".lyrics-container")],h.prototype,"lyricsContainer",void 0),window.customElements.define("am-lyrics",h),Le}var Ie=zi();const Di=Ri(Ie),Ki=Fi({__proto__:null,default:Di},[Ie]);export{Ki as a};
