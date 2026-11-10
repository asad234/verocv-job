import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const FONTS_DIR = join(process.cwd(), "public", "fonts", "cv");

const FONTS = [
  { file: "playfair-regular.ttf",         url: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFiD-vYSZviVYUb_rj3ij__anPXJzCwZvrmxpi_HF7.ttf" },
  { file: "playfair-bold.ttf",            url: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFiD-vYSZviVYUb_rj3ij__anPXJzCwZvrmxpi_THn2.ttf" },
  { file: "montserrat-regular.ttf",       url: "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw0aXp-p7K4KLg.ttf" },
  { file: "montserrat-bold.ttf",          url: "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM7Hw0aXp-p7K4KLg.ttf" },
  { file: "cormorant-regular.ttf",        url: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqHtKd9Wh.ttf" },
  { file: "cormorant-bold.ttf",           url: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYrEtKd9WhKfE.ttf" },
  { file: "raleway-regular.ttf",          url: "https://fonts.gstatic.com/s/raleway/v29/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrEz.ttf" },
  { file: "raleway-bold.ttf",             url: "https://fonts.gstatic.com/s/raleway/v29/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorPCPrEz.ttf" },
  { file: "josefinsans-regular.ttf",      url: "https://fonts.gstatic.com/s/josefinsans/v32/Qw3PZQNVED7rKGKxtqIqX5E-AVSJrOCfjY46_ArQ.ttf" },
  { file: "josefinsans-bold.ttf",         url: "https://fonts.gstatic.com/s/josefinsans/v32/Qw3PZQNVED7rKGKxtqIqX5E-AVSJrOCfjY46_DjS.ttf" },
  { file: "dmserifdisplay-regular.ttf",   url: "https://fonts.gstatic.com/s/dmserifdisplay/v15/-F6ufjN0u_6nuX_jA2psWmxKjU5Y-fS9K-M.ttf" },
  { file: "outfit-regular.ttf",           url: "https://fonts.gstatic.com/s/outfit/v11/QGYsz_MVcBeNP4NjuG_tCjvybg.ttf" },
  { file: "outfit-bold.ttf",              url: "https://fonts.gstatic.com/s/outfit/v11/QGYsz_MVcBeNP4NjuG_tCjvybg.ttf" },
  { file: "ebgaramond-regular.ttf",       url: "https://fonts.gstatic.com/s/ebgaramond/v27/SlGDmQ63dBe9_BW0_S_m7L42G0W_7R6U.ttf" },
  { file: "ebgaramond-bold.ttf",          url: "https://fonts.gstatic.com/s/ebgaramond/v27/SlGEmQ63dBe9_BW0_S_m7L42G0W_-_d0MXQ.ttf" },
  { file: "librebaskerville-regular.ttf", url: "https://fonts.gstatic.com/s/librebaskerville/v14/kmKnZrc3Hgbbcjq75U4uslyuy4kn0pNeYRI.ttf" },
  { file: "librebaskerville-bold.ttf",    url: "https://fonts.gstatic.com/s/librebaskerville/v14/kmKiZrc3Hgbbcjq75U4uslyuy4kn0qNcaxYaDg.ttf" },
  { file: "spacegrotesk-regular.ttf",     url: "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gO7iaI.ttf" },
  { file: "spacegrotesk-bold.ttf",        url: "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gO7RKI.ttf" },
  { file: "inter-regular.ttf",            url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhiJ-Ek-_EeA.ttf" },
  { file: "inter-bold.ttf",               url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFufAZJhiJ-Ek-_EeA.ttf" },
  { file: "lato-regular.ttf",             url: "https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wWw.ttf" },
  { file: "lato-bold.ttf",               url: "https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.ttf" },
  { file: "opensans-regular.ttf",         url: "https://fonts.gstatic.com/s/opensans/v40/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTSKmu1aB.ttf" },
  { file: "opensans-bold.ttf",            url: "https://fonts.gstatic.com/s/opensans/v40/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu1aB.ttf" },
  { file: "sourcesans3-regular.ttf",      url: "https://fonts.gstatic.com/s/sourcesans3/v15/nwpStKGgNLRkao9a6bOhz-CkM9Gt8bF7K4M.ttf" },
  { file: "sourcesans3-bold.ttf",         url: "https://fonts.gstatic.com/s/sourcesans3/v15/nwpStKGgNLRkao9a6bOhz-CkM9Gt8aF5K4M.ttf" },
  { file: "nunito-regular.ttf",           url: "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDIkh.ttf" },
  { file: "nunito-bold.ttf",              url: "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDOEh.ttf" },
  { file: "dmsans-regular.ttf",           url: "https://fonts.gstatic.com/s/dmsans/v14/rP2Fp2ywxg089UriI5-g4vlH9VoD8Cmcqbu6-K8.ttf" },
  { file: "dmsans-bold.ttf",              url: "https://fonts.gstatic.com/s/dmsans/v14/rP2Fp2ywxg089UriI5-g4vlH9VoD8Cmcqbu6-IM.ttf" },
  { file: "jost-regular.ttf",             url: "https://fonts.gstatic.com/s/jost/v15/92zPtBhPNqw79Ij1E865zBUv7mxjMiM.ttf" },
  { file: "jost-bold.ttf",               url: "https://fonts.gstatic.com/s/jost/v15/92zPtBhPNqw79Ij1E865zBUv7nJiMiM.ttf" },
  { file: "ptsans-regular.ttf",           url: "https://fonts.gstatic.com/s/ptsans/v17/jizaRExUiTo99u79D0KEwA.ttf" },
  { file: "ptsans-bold.ttf",              url: "https://fonts.gstatic.com/s/ptsans/v17/jizYRExUiTo99u79B_mh0O6tKA.ttf" },
  { file: "merriweather-regular.ttf",     url: "https://fonts.gstatic.com/s/merriweather/v30/u-440qyriQwlOrhSvowK_l52xwNZWMf6.ttf" },
  { file: "merriweather-bold.ttf",        url: "https://fonts.gstatic.com/s/merriweather/v30/u-4n0qyriQwlOrhSvowK_l5-eR71Wvf6jA.ttf" },
  { file: "crimsonpro-regular.ttf",       url: "https://fonts.gstatic.com/s/crimsonpro/v23/q5uDsoa5M_tv7IEe8mJYGJqzidSjbts.ttf" },
  { file: "crimsonpro-bold.ttf",          url: "https://fonts.gstatic.com/s/crimsonpro/v23/q5uDsoa5M_tv7IEe8mJYGJqzidSjbtss.ttf" },
];

await mkdir(FONTS_DIR, { recursive: true });
let ok = 0, fail = 0;

for (const { file, url } of FONTS) {
  process.stdout.write(`${file}... `);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 5000) throw new Error(`Too small: ${buf.byteLength}B`);
    await writeFile(join(FONTS_DIR, file), Buffer.from(buf));
    console.log(`OK  ${(buf.byteLength/1024).toFixed(0)}KB`);
    ok++;
  } catch (err) {
    console.log(`FAIL  ${err.message}`);
    fail++;
  }
}

console.log(`\n${ok} ok, ${fail} failed`);
if (fail > 0) process.exit(1);
