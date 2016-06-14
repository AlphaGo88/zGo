# zGo

a web go player based on html5.

## How to use

Basic usage:

```js
    new zGo({
        container: document.getElementById("main"),
        width: 520
    });
```

Initialize zGo with sgf:

```js
    var sgf = "(;GM[1]FF[4]SZ[19]DT[2015-07-01 17:28:53]PB[Ausdf]BR[7D]PW[Danlo]WR[9D]KM[-6.50]HA[0]RU[Chinese]SO[http://www.ourgame.com]EV[]RE[W+R];B[pc];W[dp];B[ed];W[qp];B[op];W[mq];B[qq];W[rq];B[pq];W[qm];B[om];W[pk];B[ro];W[rp];B[qo];W[po];B[pp];W[so];B[pn];W[rn];B[qn];W[rl];B[kp];W[mo];B[fq];W[nn];B[on];W[ip];B[np];W[mp];B[iq];W[hq];B[hp];W[gp];B[ho];W[gq];B[io];W[ir];B[jq];W[ko];B[jo];W[kn];B[ok];W[oj];B[nk];W[im];B[jr];W[nj];B[lk];W[mj];B[kl];W[jn];B[mm];W[gm];B[hl];W[hm];B[cq];W[cp];B[fp];W[go];B[dq];W[bq];B[br];W[bp];B[ar];W[gr];B[lr];W[er];B[dr];W[ds];B[cs];W[es];B[eq];W[fr];B[dl];W[dn];B[qi])";
    new zGo({
        container: document.getElementById("main"),
        sgf: sgf
    });
```
