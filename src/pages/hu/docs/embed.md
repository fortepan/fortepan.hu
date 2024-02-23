---
layout: article/article.liquid
hide_search: true
title: Listák és beágyazás
permalink: /hu/docs/embed/
_template: article
---

Ez az útmutató segít eligazodni a Fortepanon létrehozható egyedi listák (galériák) készítésében, szerkesztésében és beágyazásában.

- [Listák kezelése](#edit-lists)
  1. [Bejelentkezés és regisztráció](#login-register)
  2. [Új lista létrehozása](#create-list)
  3. [Képek listához adása](#add-photos-to-list)
  4. [Listák szerkesztése](#edit-list)
- [Listák beágyazása](#embed-list)
  - [Példa a beágyazott listára](#embed-example)
  - [A beágyazás lépései](#embed-list-steps)

---

<h2 id="edit-lists">Listák kezelése</h2>

A [Listák](https://fortepan.hu/hu/lists/) menüpont a fejlécben, a profil ikonra kattintva érhető el:

{% include image-lazyloader/image-lazyloader.liquid src:"/images/docs/embed/fortepan.hu_docs_embed_01.jpg" alt:"A Listák a profil ikonra kattintva érhető el" custom_class:"article-img autosize" %}

<h3 id="login-register">1. Bejelentkezés és regisztráció</h3>

Az egyedi listák létrehozásához és szerkesztéséhez Fortepan felhasználói fiókra van szükség. Amennyiben nem rendelkezik még fiókkal, pár egyszerű lépésben regisztrálhat a felületen.

{% include image-lazyloader/image-lazyloader.liquid src:"/images/docs/embed/fortepan.hu_docs_embed_02.jpg" alt:"Bejelentkezés és regisztráció" custom_class:"article-img autosize" %}

<h3 id="create-list">2. Új lista létrehozása</h3>

A belépést követően az **Új lista létrehozása** gombra kattintva tud új listákat létrehozni.

A megjelenő ablakban el tudja nevezni a listát, opcionálisan adhat hozzá rövid leírást, illetve beállíthatja a lista láthatóságát is. A privát listákat csak a létrehozó felhasználó tekintheti meg (bejelentkezést követően).

{% include image-lazyloader/image-lazyloader.liquid src:"/images/docs/embed/fortepan.hu_docs_embed_03.jpg" alt:"Új lista létrehozása" custom_class:"article-img autosize" %}

A sikeres létrehozást követően a **Fotók** gombra kattinva tud képeket hozzáadni a listához (mely átnavigál a [Fortepan fotóarchívumába](https://fortepan.hu/hu/photos/)).

{% include image-lazyloader/image-lazyloader.liquid src:"/images/docs/embed/fortepan.hu_docs_embed_04.jpg" alt:"Új lista létrehozása" custom_class:"article-img autosize" %}

<h3 id="add-photos-to-list">3. Képek listához adása</h3>

Új képeket a Fortepan archívumát böngészve tud a listákhoz adni. Ehhez a galéria nézetben a **Listához adás** ikonra kell kattintani:

{% include image-lazyloader/image-lazyloader.liquid src:"/images/docs/embed/fortepan.hu_docs_embed_05.jpg" alt:"Képek listához adása" custom_class:"article-img autosize" %}

Az így megjelenő ablakban ki tudja választani a listát amelyhez az adott képet hozzá kívánja adni:

{% include image-lazyloader/image-lazyloader.liquid src:"/images/docs/embed/fortepan.hu_docs_embed_06.jpg" alt:"Képek listához adása modal" custom_class:"article-img autosize" %}

<h3 id="edit-list">4. Listák szerkesztése</h3>

#### Listák oldalon

A lista neve mellett található **Szerkesztés ikonra** (három pont) kattintva megjelenő legördülő menüben talál lehetőségeket a lista szerkesztésére.

{% include image-lazyloader/image-lazyloader.liquid src:"/images/docs/embed/fortepan.hu_docs_embed_07.jpg" alt:"Listák szerkesztése a listák oldalon" custom_class:"article-img autosize" %}

#### Egy konkrét lista oldalán

A **Szerkesztés** linkre kattintva megjelenő legördülő menüben talál lehetőségeket a lista szerkesztésére.

{% include image-lazyloader/image-lazyloader.liquid src:"/images/docs/embed/fortepan.hu_docs_embed_08.jpg" alt:"Listák szerkesztése a lista oldalán" custom_class:"article-img autosize" %}

#### A legördülő menüben az alábbi lehetőségek érhetők el:

- **Szerkesztés:** a lista adatait tudja itt módosítani (név, leírás, láthatóság)
- **Lista megtekintése:** a lista képeinek oldalára navigál
- **Lista beágyazása:** egyedi beágyazó kódot generálhat a listához amelynek segítségével [be tudja ágyazni](#embed-list) a listát bármely más weboldalon
- **Lista linkjének másolása:** a vágólapra másolja a lista linkjét melyet ezután tetszőlegesen megoszthat
- **Képek hozzáadása:** a [Fotók oldalra](https://fortepan.hu/hu/photos/) navigál, ahol a galéria nézetben újabb [képeket adhat a listához](#add-photos-to-list)
- **Törlés:** itt tudja törölni a listát (és képeit)

---

<h2 id="embed-list">Listák beágyazása</h2>

A Fortepanon létrehozott listákat, csakúgy mint például videómegosztó oldalak tartalmait, bármely más weboldalon be tudja ágyazni egyedi galéria formájában.

<h3 id="embed-example">Példa a beágyazott listára:</h3>

<iframe width="100%"  style="aspect-ratio:16/9;" src="https://fortepan.hu/hu/embed/688355" frameborder="0" allow="fullscreen" allowfullscreen="true" loading="lazy"></iframe>

#### A Fortepan oldalán a beágyazáshoz szükséges kód generálásában adunk segítséget.

> Más weboldalakon történő beágyazáshoz szüksége lesz hozzáférésre az adott oldal adminisztrációs felületéhez vagy forráskódjához. Amennyiben szeretné beágyazni a Fortepanon létrehozott listáit a saját weboldalán, és nem tudja ez hogyan lehetséges, kérjük vegye fel a kapcsolatot oldalának fejlesztőjével/üzemeltetőjével.

<h3 id="embed-list-steps">A beágyazás lépései:</h3>

1\. A beágyazó kód generáláshoz válassza ki a **Lista beágyazása** opciót a [lista szerkesztése](#edit-list) legördülő menüből.

{% include image-lazyloader/image-lazyloader.liquid src:"/images/docs/embed/fortepan.hu_docs_embed_08.jpg" alt:"Listák szerkesztése a lista oldalán" custom_class:"article-img autosize" %}

2\. Az így megjelenő ablakon be tudja állítani a beágyazott galéria dimenzióit (szélesség, magasság, méretarány stb.)

{% include image-lazyloader/image-lazyloader.liquid src:"/images/docs/embed/fortepan.hu_docs_embed_09.jpg" alt:"Beágyazó kód generálása" custom_class:"article-img autosize" %}

3\. Ha minden beállítással elégedett, a **Kód másolása** gombra kattintva ki tudja másolni a beágyazó kódot és közvetlenül be tudja illeszteni saját oldalának adminisztrációs felületébe vagy forráskódjába. (Amennyiben nem tudja ez hogyan lehetséges, kérjük vegye fel a kapcsolatot oldalának fejlesztőjével/üzemeltetőjével.)

---

Bízunk benne, hogy hasznosnak találja mind a lista mind a beágyazás funkciókat.<br> Amennyiben kérdése merülne fel, vegye fel velünk a kapcsolatot elérhetőségeink egyikén.

#### A Fortepan csapata
