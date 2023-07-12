## Getting Started
```sh
git clone https://github.com/lh3/jstreeview
# then open index.html in a web browser
# open https://lh3.sourceforge.io/jstree/ in your browser for a live example
```

## Introduction

This repo provides an interactive web application for viewing or editing
[phylogenetic trees][phylotree] in the New Hampshire (aka [Newick][newick])
format or the [NHX][nhx] format.  It supports subtree collapsing, subtree
highlighting, leaf searching and reording for viewing, and supports branch
swapping, multifurcation, reroot and arbitrary topology altering for editing.

Jstreeview is written in HTML and JavaScript. You may clone this repo and open
`index.html` to use it without installation. A running example can be found
[here](https://lh3.sourceforge.io/jstree/).

You can also use jstreeview as a library. Here is a minimal example:
```html
<head><script language="JavaScript" src="knhx.js"></script></head>
<body onLoad="knhx_init('canvas', 'nhx');kn_actions.plot_str();">
<canvas id="canvas" width="800" height="800"></canvas>
<textarea id="nhx" style="display: none">
((BGIOSIFCE006902.1_ORYSA:0.652945[&&NHX:S=ORYSA],(At4g19560.1_ARATH:0.566484[&&NHX:S=ARATH],
(At4g19600.1_ARATH:0.229647[&&NHX:S=ARATH],At5g45190.1_ARATH:0.149569[&&NHX:S=ARATH]
):0.109796[&&NHX:S=ARATH:SIS=100:D=Y:B=100]):0.283052[&&NHX:S=ARATH:SIS=100:D=Y:B=100]
):0.930921[&&NHX:S=Magnoliophyta:D=N:B=100],((((((((((((CCNK_HUMAN:0.001351[&&NHX:S=HUMAN],
CCNK_F3_PANTR:0.001588[&&NHX:S=PANTR]):0.009317[&&NHX:S=Homo/Pan/Gorilla_group:D=N:B=100],
CCNK_MACMU:0.01227[&&NHX:S=MACMU]):0.020339[&&NHX:S=Catarrhini:D=N:B=100],
(CCNK_BOVIN:0.049478[&&NHX:S=BOVIN],CCNK_CANFA:0.076883[&&NHX:S=CANFA]
):0.026972[&&NHX:S=Laurasiatheria:D=N:B=97]):0.01376[&&NHX:S=Eutheria:D=N:B=62],
(Ccnk_MOUSE:0.018183[&&NHX:S=MOUSE],LOC500715_RAT:0.02728[&&NHX:S=RAT]
):0.054247[&&NHX:S=Murinae:D=N:B=100]):0.087752[&&NHX:S=Eutheria:D=N:B=65],
CCNK_MONDO:0.069457[&&NHX:S=MONDO]):0.053263[&&NHX:S=Theria:D=N:B=83],
NP_001026380_CHICK:0.085022[&&NHX:S=CHICK]):0.059401[&&NHX:S=Amniota:D=N:B=80],
CCNK_XENTR:0.175799[&&NHX:S=XENTR]):0.075577[&&NHX:S=Tetrapoda:D=N:B=97],
((si_dkey-60a16_F2_BRARE:0.143195[&&NHX:S=BRARE],(CCNK_TETNG:0.142629[&&NHX:S=TETNG],
CCNK_F2_GASAC:0.115749[&&NHX:S=GASAC]):0.130837[&&NHX:S=Percomorpha:D=N:B=100]
):0.077038[&&NHX:S=Clupeocephala:D=N:B=95],ENSGACT00000017400_GASAC:0.40355[&&NHX:S=GASAC]
):0.058401[&&NHX:S=Clupeocephala:SIS=33:D=Y:B=13]):0.233994[&&NHX:S=Euteleostomi:D=N:B=18],
(ENSCINT00000017473_CIOIN:0[&&NHX:S=CIOIN],ENSCINT00000026852_CIOIN:0.002343[&&NHX:S=CIOIN]
):0.481407[&&NHX:S=CIOIN:SIS=100:D=Y:B=100]):0.090892[&&NHX:S=Chordata:D=N:B=98],
((CycK-RA_DROME:0.17719[&&NHX:S=DROME],dper_GLEANR_8777_caf1_DROPE:0.174477[&&NHX:S=DROPE]
):0.199588[&&NHX:S=Sophophora:D=N:B=100],(AAEL013531-RA_AEDAE:0.214131[&&NHX:S=AEDAE],
XP_317464_ANOGA:0.204436[&&NHX:S=ANOGA]):0.178396[&&NHX:S=Culicidae:D=N:B=100]
):0.293157[&&NHX:S=Diptera:D=N:B=100]):0.104694[&&NHX:S=Coelomata:D=N:B=98],
Smp_130980_SCHMA:0.624197[&&NHX:S=SCHMA]):0.041513[&&NHX:S=Bilateria:D=N:B=84],
(WBGene00009650_CAEEL:0.186775[&&NHX:S=CAEEL],(CBG04574_CAEBR:0.21279[&&NHX:S=CAEBR],
cr01.sctg48.wum.67.1_CAERE:0.192611[&&NHX:S=CAERE]):0.076335[&&NHX:S=Caenorhabditis:D=N:B=86]
):1.18006[&&NHX:S=Caenorhabditis:D=N:B=86]):0.311276[&&NHX:S=Bilateria:D=N:B=84]
)[&&NHX:S=Eukaryota:D=N:B=0];
</textarea>
</body>
```

## History

I created this project in 2008 initially for curating TreeFam trees. The source
code was managed by an obsolete version of subversion which is incompatible
with the latest subversion. Although I have not touched the source code for
over a decade, I have still used the viewer from time to time to visualize
phylogenetic trees.

Recently when I worked on GFA visualization, I realized that I could draw
sharper shapes and texts on HTML canvas, so I decide to update this project.
In addition, jstreeview was using a third-party text drawing library as few web
browsers supported text drawing in 2008. The update now supports built-in
canvas fonts.

Looking at my old code, I think some design choices at the time are
questionable and may benefit a revamp. I will leave this to another day, or
the project may never see the light of day.

[phylotree]: https://en.wikipedia.org/wiki/Phylogenetic_tree
[newick]: https://en.wikipedia.org/wiki/Newick_format
[nhx]: https://en.wikipedia.org/wiki/Newick_format#New_Hampshire_X_format
