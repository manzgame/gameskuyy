# VoxelCraft Web

Game voxel 3D original yang bisa dijalankan sebagai website. Ini **bukan Minecraft resmi**, bukan produk Mojang/Microsoft, dan tidak boleh dipromosikan seolah-olah official.

## Cara menjalankan

### Cara paling gampang
1. Extract zip ini.
2. Buka folder hasil extract.
3. Jalankan server lokal:

```bash
python -m http.server 8000
```

atau:

```bash
python3 -m http.server 8000
```

4. Buka browser ke:

```text
http://localhost:8000
```

> Catatan: project ini memakai Three.js dari CDN. Jadi saat pertama kali dibuka, internet dibutuhkan untuk mengambil library Three.js. Setelah itu browser biasanya menyimpan cache.

## Kontrol desktop

- WASD: bergerak
- Shift: lari
- Space: lompat
- Mouse: lihat sekitar
- Klik kiri: hancurkan block
- Klik kanan: letakkan block
- Scroll / tombol 1-8: pilih block
- Esc / E: menu pause

## Kontrol HP / tablet

- Tombol kiri: maju, mundur, kiri, kanan
- Geser layar: lihat sekitar
- JUMP: lompat
- BREAK: hancurkan block yang diarahkan crosshair
- PLACE: letakkan block
- MENU: pause

## Fitur

- Menu awal: Mulai Game, Pengaturan, Reset Dunia
- Terrain 3D procedural
- Grass, dirt, stone, sand, cobblestone, log, planks, glass, leaves, water
- Pohon procedural
- Hotbar block
- Build & break block
- Crosshair dan outline block target
- Mobile touch controls
- Auto-save localStorage
- Pengaturan sensitivitas, FOV, render distance, fancy sky

## Texture credit

Beberapa texture menggunakan Faithful Resource Pack 32x.

Credit:
- Faithful Resource Pack
- https://faithfulpack.net/

Lisensi Faithful disertakan di:

```text
licenses/FAITHFUL_LICENSE.txt
```

Sesuai lisensi di file tersebut, jangan monetisasi project yang berisi texture Faithful, jangan klaim sebagai karya sendiri, dan jangan buat terlihat official.
