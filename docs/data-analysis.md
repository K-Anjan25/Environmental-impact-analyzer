# Data analysis: what the calculator needs

Status: working inventory, written from the repository as of commit 2a53273. Confirm the open questions at the end before the next build stage.

## 1. What we calculate

- **Input:** a process (for example "Fabric dyeing" or "Spinning to yarn") and a quantity in that process's reference unit (for example 0.18 kg of yarn).
- **Output, per row:** 16 EF 3.1 impact indicators, each equal to the published factor multiplied by the quantity.
- **Output, per selection:** a subtotal of the selected rows, and an EF 3.1 single score (normalised values weighted with the JRC weights).
- **Not calculated:** a whole-product footprint, cotton cultivation, transport, and use phase. The app states this on every result.

## 2. For whom, and for what purpose

Working assumption, to be confirmed: apparel and footwear designers, brands, and students who want a transparent, source-cited estimate for individual process steps. The purpose is to compare process choices, not to make an environmental claim about a product.

## 3. Data that is used at runtime

The API loads 12 CSV files (about 142 KB in total), one per process family:

| File | Process family |
|---|---|
| `datasets/spinning/impact-scores.csv` | Spinning (158 rows) |
| `datasets/knitting/impact-scores.csv` | Knitting |
| `datasets/weaving/impact-scores.csv` | Weaving |
| `datasets/dyeing/impact-scores.csv` | Dyeing (37 rows) |
| `datasets/finishing/impact-scores.csv` | Finishing |
| `datasets/printing/impact-scores.csv` | Printing |
| `datasets/textile-assembly/impact-scores.csv` | Textile assembly |
| `datasets/shoe-assembly/sneaker/impact-scores.csv` | Sneaker assembly |
| `datasets/shoe-assembly/womens-boots/impact-scores.csv` | Women's boots assembly |
| `datasets/synthetic-pu-leather/impact-scores.csv` | Synthetic PU leather |
| `datasets/natural-rubber/impact-scores.csv` | Natural rubber |
| `datasets/use-phase/impact-scores.csv` | Use phase (consumer use only) |

Columns in each file:

- `descriptor` and `Activity`: the process name shown to the user.
- 16 indicator columns: `ACD, ETF, FRU, FWE, GHG, HTC, HTN, IOR, LDU, MRU, OZD, PCO, PMA, SWE, TRE, WTU`. Each is the factor for 1 reference unit.
- Data-quality columns: `P_dqr, TiR_dqr, TeR_dqr, GR_dqr`.
- `Input_required_kg`: the input mass per reference unit, used for the mass check.

The knitting file uses a different header for input mass (`Input required (kg)`). Read columns by their actual header names.

## 4. Data that is not used at runtime

- `datasets/sources/uslci/`: about 151 MB of raw USLCI process JSON. Not read by the API. Excluded from the Docker image as of 2a53273. Kept in the repository for provenance.
- `datasets/sources/defra-2026/`: about 2.6 MB of raw DEFRA 2026 factors. The app uses fixed values in `ghg-supplement.ts`. Excluded from the image.
- `datasets/sources/SOURCE-RECORD.md`: kept in the image, because the source-record legal page refers to the provenance.

## 5. Gaps and risks the analysis found

1. **Coverage:** no cotton cultivation, ginning, or transport rows. A product total cannot be built from these rows alone.
2. **Mass conventions differ** between dyeing and finishing (wet and dry mass). Combining rows needs a stated convention.
3. **Matching assumptions:** the 330 dtex spinning-to-knitting link is a stated assumption, not a published factor.
4. **Data quality:** the `*_dqr` columns are not shown to the user yet.
5. **Naming:** the process names are long and technical ("Spinning to yarn, Coton Combed - Weaving, 150 dtex, Ring Spinning"). Plain-language labels would need a mapping, reviewed by someone who knows textile processing.

## 6. Terms that need an explanation for users

- EF 3.1, JRC normalisation and weighting: a standard method for combining indicators. Explain once on the method page.
- Reference unit and dtex: the unit a factor is published in, and a yarn fineness measure. Show both next to each input.
- Indicator codes (ACD, ETF, GHG, and so on): show the full name on hover or in the table header.
- DQR: a data quality rating. Explain what each score means before showing it.

## 7. Open questions for the owner

1. Who is the primary user: designers, brand sustainability teams, or students?
2. Which processes must be covered first?
3. Who checks the process-name mapping and the dtex assumption?
4. Should the data-quality ratings be shown to users?
5. Which EF 3.1 reference year and JRC file version are the official ones?
