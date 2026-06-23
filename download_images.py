"""
幾隻貓團購 0701 - 圖片下載腳本
使用 Playwright 建立 session 後，透過 context.request.get() 下載所有商品圖片
"""

import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

# CDN URL mapping（id -> CDN base URL）
CDN_MAPPING = {
    'a01': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/g9M05D783DyODZaQlRoA6Z1W/',
    'a02': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/Xno5Qb1D3MVmpXX1l67ZWPv9/',
    'a03': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/ZOaL8DPWY6LG4B7Pl92ExyG0/',
    'a04': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/Wqybvx25N9ykZDRKNREOMVPo/',
    'a05': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/41brG7JDYpJQX2WplxW5ywvg/',
    'a06': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/LWx9yMqPlG7QB8JelEpb1wO7/',
    'a07': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/Gr1Lb8a63ZLADKnrNEAXx24D/',
    'a08': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/xQdpkWj03aePBgp439by6aRo/',
    'a09': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/EM7nvrbJlqVOvWdoNBpxVwjP/',
    'a10': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/EM7nvrbJlqVOvW8DNBpxVwjP/',
    'a11': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/GBnwbKdx3dveaXKvNW7954ej/',
    'a12': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/LWx9yMqPlG7JqrbelEpb1wO7/',
    'a13': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/zXOMxVeg3Vbvkd9138aGjDkP/',
    'a14': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/y8Rxg1qMlj8BodxRYbLe06wn/',
    'a15': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/nMRpQ02P3XERZd21lr7BkJaE/',
    'a16': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/BW4907rb3bPQ0p99NQGK6kwy/',
    'a17': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/dqpOVABK324BjQmONrkRwEv7/',
    'a18': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/Xno5Qb1D3MVg0Zkql67ZWPv9/',
    'a19': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/zXOMxVeg3Vbv0WzK38aGjDkP/',
    'a20': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/wx1WRpGD38JojWBwNJnad4eb/',
    'a21': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/o4a0bwXWNWb40PZBlGgE1yzv/',
    'a22': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/7b8Wmjk2l59Dj8OWlvD1VZrP/',
    'a23': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/DPq15dgL3PqvKQgxlrBbJ2am/',
    'a24': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/wP6vpqMBNgz1gD5old7DaZ0y/',
    'a25': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/O5gwrR4GNQb40VdJYBpn071e/',
    'a26': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/v5zx6meKY4vkjn0gl0DVkLyo/',
    'b01': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/rAW85emGlnzzdqAAlyok6vBL/',
    'b02': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/EM7nvrbJlqVVdjA8NBpxVwjP/',
    'c01': 'https://img.1shop.tw/Q8Zzy1eojALkqZO0qDpx739K/BW4907rb3bPQmJ8xNQGK6kwy/',
}

IMAGES_DIR = Path(__file__).parent / 'images'
SEED_URL = 'https://h29lzx.1shop-app.com/n7ayhm幾隻貓'
IMG_SUFFIX = 'original-2.jpg.avif'


async def download_all():
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                       'AppleWebKit/537.36 (KHTML, like Gecko) '
                       'Chrome/124.0.0.0 Safari/537.36',
            extra_http_headers={
                'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
            }
        )
        page = await context.new_page()

        # 建立 session：先拜訪 1shop 頁面
        print(f'[1/2] 建立 session，前往 {SEED_URL} ...')
        try:
            await page.goto(SEED_URL, timeout=30000, wait_until='domcontentloaded')
            await page.wait_for_timeout(2000)
            print('      Session 建立成功')
        except Exception as e:
            print(f'      Warning: session 頁面載入異常（{e}），繼續嘗試下載...')

        # 下載圖片
        print(f'\n[2/2] 開始下載 {len(CDN_MAPPING)} 張圖片...')
        success = 0
        failed = []

        for img_id, base_url in CDN_MAPPING.items():
            out_path = IMAGES_DIR / f'{img_id}.avif'
            img_url = base_url + IMG_SUFFIX

            try:
                response = await context.request.get(
                    img_url,
                    headers={
                        'Referer': 'https://1shop-app.com/',
                        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                    },
                    timeout=20000,
                )

                if response.ok:
                    body = await response.body()
                    out_path.write_bytes(body)
                    size_kb = len(body) / 1024
                    print(f'  ✓ {img_id}.avif  ({size_kb:.1f} KB)')
                    success += 1
                else:
                    print(f'  ✗ {img_id}  HTTP {response.status}  {img_url}')
                    failed.append(img_id)

            except Exception as e:
                print(f'  ✗ {img_id}  Error: {e}')
                failed.append(img_id)

            # 短暫間隔避免觸發限流
            await page.wait_for_timeout(300)

        await browser.close()

        print(f'\n==============================')
        print(f'完成！成功 {success}/{len(CDN_MAPPING)} 張')
        if failed:
            print(f'失敗：{", ".join(failed)}')
            print('請手動確認失敗的圖片 URL 是否正確')
        else:
            print('所有圖片下載成功！')
        print(f'圖片存放位置：{IMAGES_DIR}')


if __name__ == '__main__':
    asyncio.run(download_all())
