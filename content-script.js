(function () {
    'use strict';

    let enableInsertRomaji = true;
    let pitchAccentCache = {};
    let kanjiCache = {};
    const highlightClasses = ['success' /* green */, 'info' /* blue */, 'warning' /* orange */, 'highlight' /* yellow */, 'random1', 'random2'];

    const excludeTags = new Set(['ruby', 'rt', 'script', 'select', 'option', 'textarea']);
    const COMMON_WORDS = new Set(['学校', '学生', '先生', '勉強', '日本', '英語',
        '国語', '数学', '大学', '留学', '友達', '友達', '名前', '外国', '男子', '女子',
        '大人', '子供', '会社', '社員', '今日', '明日', '昨日', '毎日', '毎週', '今週',
        '来週', '午前', '午後', '時間', '日本', '東京', '学校', '駅前', '空港', '病院',
        '銀行', '郵便', '公園', '本屋', '食事', '飲物', '牛肉', '豚肉', '鳥肉', '野菜',
        '果物', '水道', '料理', '朝食', '勉強', '運動', '旅行', '電話', '買物', '散歩',
        '仕事', '結婚', '休憩', '練習', '元気', '有名', '簡単', '大切', '上手', '下手', '便利', '不便', '電車', '自動', '車道', '空港', '道路', '交通', '乗車', '下車', '運転', '駐車', '天気', '電気', '人気', '元日', '毎年', '来年', '去年', '部屋', '家事', '住所', '電話', '写真', '映画', '音楽', '雑誌', '新聞', '地図', '問題', '意味', '研究', '試験', '宿題', '授業', '卒業', '入学', '退学', '就職', '転職', '失業',
        '経験', '意見', '約束', '関係', '理由', '性格', '習慣', '感情', '自由', '平和',
        '最近', '最初', '最後', '途中', '以上', '以下', '以前', '以後', '当時', '将来',
        '場所', '住所', '近所', '郊外', '都会', '田舎', '景色', '自然', '環境', '地域',
        '準備', '説明', '連絡', '相談', '利用', '案内', '予約', '参加', '運転', '注意',
        '必要', '大事', '安全', '危険', '便利', '不便', '簡単', '複雑', '有名', '特別',
        '交通', '事故', '運賃', '到着', '出発', '遅刻', '早退', '渋滞', '駐車', '移動',
        '生活', '食事', '掃除', '洗濯', '買物', '料理', '家事', '留守', '留学', '帰国',
        '意味', '理解', '可能', '絶対', '原因', '結果', '方法', '目的', '計画', '決定',
        '新聞', '記事', '放送', '番組', '連続', '中止', '変更', '発表', '会議', '予定',
        '無理', '十分', '普通', '特に', '全然', '必ず', '多分', '一度', '二度', '一緒',
        '今回', '次回', '前回', '確認', '判断', '解決', '説明', '理解', '関心', '印象',
        '状況', '原因', '結果', '目的', '方法', '計画', '相談', '注意', '確認', '経験',
        '自分', '結構', '本当', '一応', '全部', '女性', '男性', '言葉', '合格', '人間',
        '場合', '綺麗', '高校', '一番', '家族', '基本', '秘密', '動画', '会話', '相手', '紹介', '重要', '失敗', '部分', '成功',
        '世界', '漢字', '緊張', '存在', '彼女', '中国', '韓国', '試合', '温泉', '面接', '心配', '文法',
        '警察', '突然', '母親', '父親', '笑顔', '荷物', '風邪', '個人', '先輩', '社長', '挨拶', '野球',
        '是非', '店員', '態度', '興味', '息子', '恋人', '情報', '恋愛', '美人', '今度', '財布', '怪我',
        '文化', '店長', '不安', '人生', '失礼', '以外', '注文', '家賃', '担当', '画面', '技術', '種類',
        '食べ', '行っ', '言っ', '思っ', '思う', '思い', '言わ', '言う', '言え', '行か', '行こ', '見え', '見える', '見せる', '見る', '見よ', '見れ', '答え', '使い', '飲ん', '切り', '分かっ', '忘れ', '待っ', '持っ', '来る', '教え', '話し', '感じ', '働く', '作っ', 'いく', 'やる', 'しい', 'いう', 'やっ', '食べる', 'どう', 'そう', 'さすが', 'そう', '本当に',
        'なっ', 'する', 'とん', 'いる', 'ある', 'すぎ', 'てる', 'わかる', 'できる', 'わから', 'できよ', '止め', 'やろ', 'とっ', 'やり', 'なる', 'でき', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        '話せる', 'しく', 'かも', 'あっ', 'わかっ', 'つい', 'ちょっと', 'こう', 'まあ', 'あんまり',
        'やっぱり', 'もう', 'まだ', 'あり', 'つく', '困っ', 'いけ', 'あれ', '行き', '先週', 'ちゃんと',
        '考える', '考え', 'やめ', 'なぜ', 'どうして', 'いい', 'かっ', 'けっ', 'いつも', '迷惑', 'さらに', '現在',
        '質問', '二つ', 'これから', 'すぐ', '信じ', '覚える', 'ご飯', '頑張り', 'なんで', '自己', 'もしかして', '分から',
        'お腹', '終わり', '頑張れ', '頑張ら', 'よっ', 'もっと', 'はね', '使う', 'ならん', 'おら', 'ください', 'かっこいい',
        'ぜひ', 'わかり', '内容', '読ん', '疲れ', '好き', '違う', 'しよ', '初めて', 'お金', 'こん', 'とても', 'れれ',
        'いろいろ', 'いえ', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

    const BLACK_LISTED_WORDS = new Set([
        '映る', '', '', '', '', '',
        '収まる', '収める', '', '', '', '',
        'じっくり', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
    ]);

    const KANJIS = {
        '審査': 'Thẩm tra, kiểm tra',
        '審判': 'Thẩm phán',
        '不審': 'Hoài nghi, nghi ngờ',
        '審議': 'Cân nhắc, xem xét',
        '査証': 'Thị thực, visa',
        '証拠': 'Chứng cứ, bằng chứng',
        '証明': 'Chứng minh',
        '保証': 'Bảo đảm, cam kết',
        '貼付': 'Dán, dính vào, gắn vào',
        '指紋': 'Dấu vân tay',
        '撮影': 'Chụp ảnh',
        '影響': 'Ảnh hưởng',
        '人影': 'Bóng của người, linh hồn',
        '麻酔': 'Ma túy, chất gây nghiện',
        '麻薬': 'Thuốc mê',
        '洗剤': 'Xà phòng',
        '錠剤': 'Viên thuốc',
        '拳銃': 'Súng lục',
        '鉄砲': 'Khẩu súng',
        '偽物': 'Đồ giả',
        '偽造': 'Làm giả',
        '侵入': 'Xâm lược, xâm nhập',
        '侵害': 'Vi phạm, xâm hại',
        '猟銃': 'Súng săn',
        '狩猟': 'Sự đi săn',
        '刀剣': 'Đao kiếm',
        '真剣': 'Nghiêm trang, đúng đắn',
        '検疫': 'Kiểm dịch',
        '免疫': 'Miễn dịch',
        '刑罰': 'Hình phạt',
        '処罰': 'Xử phạt',
        '奨励': 'Khuyến khích',
        '該当': 'Tương ứng, liên quan',
        '没収': 'Tịch thu, tước quyền',
        '沈没': 'Sự chìm xuống, say bí tỉ ngã xuống',
        '状態': 'Trạng thái',
        '形態': 'Hình thái',
        '態度': 'Thái độ',
        '校舎': 'Khu nhà cao tầng',
        '宿舎': 'Ký túc xá',
        '田舎': 'Nông thôn',
        '抽選': 'Rút thăm, xổ số',
        '感謝': 'Cảm ơn',
        '謝礼': 'Quà cảm tạ',
        '謝罪': 'Tạ lỗi',
        '敷金': 'Tiền đặt cọc',
        '敷地': 'Mặt bằng',
        '屋敷': 'Khu nhà ở, dinh cơ',
        '契機': 'Cơ hội, thời cơ',
        '契約': 'Hợp đồng',
        '返却': 'Sự trả lại, hoàn trả',
        '脱却': 'Thoát khỏi, vứt bỏ',
        '冷却': 'Sự làm lạnh, ướp lạnh đồ ăn',
        '斡旋': 'Làm trung gian hòa giải',
        '詳細': 'Tường tận, chi tiết',
        '施設': 'Cơ sở, thiết bị',
        '施行': 'Thi hành, thực hiện',
        '実施': 'Thực thi',
        '施工': 'Thi công',
        '廃止': 'Hủy bỏ, bãi bỏ, đình chỉ',
        '廃絶': 'Dập tắt',
        '荒廃': 'Phá hủy, tàn phá',
        '廃棄': 'Sự vứt bỏ; sự hủy bỏ, phế thải',
        '記載': 'Ghi chép',
        '掲載': 'Đăng bài, lên báo',
        '普及': 'Phổ cập',
        '追及': 'Điều tra',
        '国籍': 'Quốc tịch',
        '戸籍': 'Hộ tịch, hộ khẩu',
        '書籍': 'Sách vở, cuốn sách, thư mục',
        '学籍': 'Thành tích, thành tựu, huy hiệu...',
        '在籍': 'Đăng ký',
        '除籍': 'Tách hộ tịch, tách khẩu',
        '金属': 'Kim loại',
        '所属': 'Thuộc bộ phận, đảm nhiệm',
        '要旨': 'Cái cốt yếu, yếu tố cần thiết, cái cốt lõi, sự tóm lược',
        '趣旨': 'Ý đồ, mục đích',
        '携帯': 'Mang theo, cầm theo',
        '提携': 'Hợp tác',
        '前提': 'Tiền đề, tiên đề',
        '提案': 'Đề án',
        '提出': 'Nộp (báo cáo, tài liệu, bài kiểm tra...)',
        '提示': 'Biểu diễn, trưng bày, gợi ý, trích dẫn',
        '紛争': 'Cuộc tranh chấp, phân tranh',
        '紛失': 'Làm mất, đánh mất',
        '渋滞': 'Kẹt xe, tắc nghẽn giao thông',
        '滞在': 'Lưu lại, trú lại, ở...',
        '停滞': 'Đình trệ',
        '講義': 'Bài giảng, giờ học',
        '定義': 'Định nghĩa',
        '義務': 'Nghĩa vụ, bổn phận',
        '正義': 'Chính nghĩa, công lý',
        '傷害': 'Vết thương',
        '負傷': 'Bị thương',
        '偶数': 'Số chẵn',
        '偶然': 'Sự tình cờ, ngẫu nhiên',
        '遭難': 'Thảm họa, tai nạn',
        '遭遇': 'Cuộc chạm trán, bắt gặp',
        '代償': 'Sự đền bù, bồi thường',
        '弁償': 'Bồi thường',
        '無償': 'Không bồi thường, không đòi hỏi, miễn trách nhiệm',
        '補償': 'Đền bù, bồi thường',
        '火災': 'Hỏa hoạn, cháy',
        '災難': 'Rủi ro, đen đủi, nạn...',
        '災害': 'Thảm họa, tai họa, nạn',
        '防災': 'Phòng chống thiên tai',
        '勧誘': 'Khuyên bảo, xúi dục, dụ dỗ, rủ rê',
        '勧告': 'Khuyến cáo, bảo ban...',
        '申請': 'Thỉnh cầu, yêu cầu',
        '請求': 'Thỉnh cầu, yêu cầu',
        '要請': 'Xin, cầu, yêu cầu',
        '距離': 'Cách xa, khoảng cách, cự li',
        '離婚': 'Ly hôn',
        '分離': 'Ngăn cách, phân ly',
        '休暇': 'Kỳ nghỉ, nghỉ ngơi',
        '余暇': 'Thời gian rỗi, thời gian rảnh rỗi',
        '診断': 'Chuẩn đoán, khám bệnh',
        '診察': 'Khám bệnh',
        '受診': 'Khám bệnh, kiểm tra sức khỏe',
        '元旦': 'Ngày mùng 1 Tết',
        '一旦': 'Một khi, một chút, tạm...',
        '納入': 'Thu nạp',
        '返納': 'Sự khôi phục, trở lại',
        '滞納': 'Không trả nợ, vỡ nợ, nộp chậm',
        '納得': 'Lý giải, đồng ý, thuyết phục',
        '婚姻': 'Hôn nhân',
        '幼稚': 'Non nớt, ấu trĩ',
        '分析': 'Phân tích',
        '解析': 'Phân tích',
        '基盤': 'Nền móng, cơ sở',
        '地盤': 'Địa bàn',
        '創立': 'Sáng lập',
        '創作': 'Sáng tạo',
        '創刊': 'Xuất bản, số phát hành đầu tiên',
        '創造': 'Sáng tạo',
        '体系': 'Hệ thống cấu tạo',
        '系統': 'Hệ thống',
        '応援': 'Cổ vũ, động viên',
        '援助': 'Chi viện, hỗ trợ',
        '救援': 'Cứu tế, cứu trợ',
        '支援': 'Viện trợ, ủng hộ',
        '購買': 'Sự mua, việc mua',
        '購入': 'Việc mua',
        '購読': 'Sự đặt mua báo',
        '専攻': 'Chuyên ngành',
        '攻撃': 'Công kích',
        '聴覚': 'Thính giác',
        '聴講': 'Nghe giảng, dự thính',
        '批准': 'Thông qua',
        '締結': 'Kết thúc hợp đồng',
        '掲示': 'Thông báo',
        '名簿': 'Danh bạ, danh sách',
        '簿記': 'Ghi sổ, ghi chép',
        '博士': 'Tiến sĩ',
        '履歴': 'Lịch sử, lý lịch',
        '履修': 'Quá trình, diễn biến',
        '還暦': 'Lão thọ, mừng thọ 60 tuổi',
        '西暦': 'Dương lịch, kỷ nguyên Thiên Chúa',
        '採択': 'Sự lựa chọn',
        '欄干': 'Tay vịn, lan can (cầu thang)',
        '緊急': 'Cấp bách, khẩn cấp',
        '緊張': 'Căng thẳng, lo lắng',
        '必須': 'Cần thiết',
        '項目': 'Mục, khoản, điều khoản',
        '事項': 'Sự việc, điều khoản',
        '要項': 'Các mục yêu cầu, các mục quan trọng',
        '教養': 'Nuôi dưỡng, giáo dục, giáo dưỡng',
        '養分': 'Chất bổ',
        '栄養': 'Dinh dưỡng',
        '休養': 'An dưỡng, nghỉ ngơi, tĩnh dưỡng',
        '哲学': 'Triết học',
        '倫理': 'Đạo nghĩa, luân lý',
        '概論': 'Khái luận, tóm tắt',
        '概念': 'Khái niệm',
        '概観': 'Nét ngoài, đường nét, hình dáng',
        '概説': 'Phác thảo, vạch ra',
        '概略': 'Khái lược, tóm tắt, khái quát, tóm lược, sơ lược',
        '基礎': 'Cơ sở',
        '削除': 'Xóa bỏ, gạch bỏ',
        '削減': 'Cắt giảm',
        '付属': 'Phụ thuộc, sáp nhập',
        '韓国': 'Hàn Quốc',
        '従来': 'Cho đến giờ, tới nay, từ trước',
        '従事': 'Hành nghề, việc thực hiện, nghiệp vụ',
        '翻訳': 'Dịch văn bản',
        '通訳': 'Thông dịch (dịch nói)',
        '稼働': 'Hoạt động, làm việc',
        '報酬': 'Trả công, thù lao',
        '名称': 'Danh hiệu, tên gọi',
        '葛藤': 'Xung đột',
        '修飾': 'Tô điểm, trang điểm',
        '装飾': 'Đồ trang trí trên quần áo',
        '箇月': 'Tháng',
        '箇所': 'Chỗ, địa điểm',
        '訂正': 'Sửa lại, đính chính',
        '改訂': 'Đính chính, sửa đổi',
        '弁当': 'Cơm hộp',
        '弁護': 'Biện hộ',
        '弁解': 'Biện giải, biện minh',
        '保護': 'Bảo hộ',
        '介護': 'Chăm sóc, điều dưỡng',
        '護衛': 'Hộ vệ, bảo vệ',
        '学士': 'Cử nhân',
        '修士': 'Thạc sĩ',
        '所轄': 'Thẩm quyền, quyền thực thi pháp luật',
        '近頃': 'Gần đây',
        '日頃': 'Thường xuyên',
        '不振': 'Không trôi chảy',
        '振動': 'Chấn động',
        '通帳': 'Số tài khoản',
        '手帳': 'Sổ tay',
        '優秀': 'Ưu tú, xuất sắc',
        '虚偽': 'Giả dối',
        '謙虚': 'Khiêm tốn',
        '虚弱': 'Gầy yếu, ẻo lả',
        '誓約': 'Thề ước, cam đoan',
        '懲戒': 'Sự trừng phạt',
        '懲役': 'Phạt tù cải tạo',
        '警戒': 'Cảnh giác, đề phòng',
        '戒律': 'Điều dạy bảo',
        '激励': 'Khích lệ, động viên',
        '投票': 'Bỏ phiếu',
        '推定': 'Suy đoán',
        '推進': 'Thúc đẩy',
        '推測': 'Dự đoán',
        '推論': 'Suy ra',
        '推薦': 'Giới thiệu, tiến cử',
        '図鑑': 'Từ điển bằng hình ảnh',
        '年鑑': 'Niên giám',
        '印鑑': 'Con dấu',
        '鑑賞': 'Thưởng thức, đánh giá',
        '鑑定': 'Giám định',
        '故障': 'Hỏng, hỏng hóc máy móc',
        '障害': 'Trở ngại, chướng ngại',
        '障子': 'Vách ngăn',
        '保障': 'Đảm bảo',
        '風俗': 'Tục lệ',
        '民族': 'Phong tục, tập quán',
        '堅実': 'Vững chắc',
        '就業': 'Làm thuê, làm công',
        '就職': 'Tìm việc làm',
        '就労': 'Làm việc',
        '就任': 'Đảm đương gánh vác',
        '金融': 'Tài chính tín dụng',
        '融資': 'Cấp vốn, bỏ vốn cho vay',
        '繊維': 'Sợi',
        '維持': 'Giữ nguyên, duy trì',
        '鉄鋼': 'Gang thép, sắt thép',
        '企業': 'Doanh nghiệp, xí nghiệp',
        '企画': 'Quy hoạch, kế hoạch',
        '幹部': 'Cán bộ, phụ trách, người lãnh đạo',
        '利益': 'Lợi ích',
        '損益': 'Lỗ lãi',
        '収益': 'Tiền lãi',
        '有益': 'Có lợi, bổ ích',
        '慎重': 'Thận trọng',
        '敏感': 'Nhạy cảm, mẫn cảm',
        '過敏': 'Nhạy cảm, nóng nảy, hoảng hốt',
        '高揚': 'Nâng cao tinh thần',
        '方策': 'Đối sách',
        '対策': 'Biện pháp',
        '政策': 'Chính sách',
        '索引': 'Mục lục',
        '模索': 'Dò dẫm, thăm dò',
        '検索': 'Tìm kiếm',
        '捜索': 'Tìm kiếm, điều tra',
        '先輩': 'Người đi trước',
        '後輩': 'Người đi sau',
        '遠慮': 'Ngại ngần',
        '配慮': 'Lo nghĩ, lo toan, lo ngại',
        '苦慮': 'Căng thẳng đầu óc, lo lắng',
        '考慮': 'Xem xét, suy tính, quan tâm',
        '避難': 'Sơ tán',
        '回避': 'Tránh né',
        '逃避': 'Thoát',
        '合唱': 'Hợp xướng',
        '復唱': 'Lặp lại, kể lại, thuật lại',
        '待遇': 'Đối đãi',
        '境遇': 'Hoàn cảnh, tình huống, điều kiện',
        '厳禁': 'Cấm',
        '厳密': 'Sát sao, chặt chẽ',
        '厳重': 'Nghiêm trọng',
        '厳正': 'Nghiêm chỉnh, nghiêm túc',
        '開催': 'Tổ chức',
        '催促': 'Thúc giục, giục giã',
        '主催': 'Đăng cai, chủ trì, chủ tọa',
        '礼儀': 'Lễ nghi',
        '行儀': 'Cách cư xử',
        '儀式': 'Nghi thức, nghi lễ',
        '組織': 'Tổ chức',
        '織物': 'Vải dệt',
        '過疎': 'Sự giảm dân số',
        '疎遠': 'Xa cách',
        '疎外': 'Xa lánh',
        '一致': 'Nhất trí, thống nhất',
        '合致': 'Thống nhất quan điểm',
        '顧客': 'Khách hàng, khách',
        '顧問': 'Cố vấn, tư vấn, khuyên bảo',
        '既婚': 'Đã có gia đình, đã kết hôn',
        '既存': 'Tồn tại, cái có sẵn...',
        '開拓': 'Khai thác, khai phá',
        '山脈': 'Dãy núi',
        '文脈': 'Văn cảnh, ngữ cảnh, mạch văn',
        '人脈': 'Kết nối con người, mối quan hệ',
        '宣伝': 'Tuyên truyền, thông tin',
        '宣言': 'Tuyên ngôn, thông báo, tuyên bố',
        '促進': 'Xúc tiến, thúc đẩy',
        '円滑': 'Trôi chảy, trơn tru',
        '滑稽': 'Buồn cười, ngố',
        '秘密': 'Bí mật',
        '秘書': 'Bí thư, thư ký',
        '姿勢': 'Tư thế, điệu bộ, thái độ',
        '需要': 'Nhu cầu, vật nhu yếu',
        '店舗': 'Cửa hàng, cửa hiệu',
        '舗装': 'Tráng nhựa, rải nhựa đường',
        '把握': 'Sự lĩnh hội, nắm vững',
        '握手': 'Bắt tay',
        '伝統': 'Truyền thống',
        '統計': 'Thống kê',
        '統一': 'Thống nhất',
        '括弧': 'Dấu ngoặc đơn, trong ngoặc',
        '統括': 'Thống nhất',
        '一括': 'Gộp, tổng cộng, cùng',
        '痩身': 'Cơ thể mảnh mai, dáng thon thả',
        '行為': 'Hành vi, hành động',
        '為替': 'Hối đoái, ngân phiếu',
        '負債': 'Mắc nợ, nợ nần',
        '債券': 'Trái phiếu, giấy, phiếu nợ',
        '債務': 'Món nợ, tiền nợ',
        '株価': 'Giá cổ phiếu',
        '掛算': 'Nhân, phép tính nhân, nhân lên',
        '掛金': 'Tiền trả góp',
        '患者': 'Bệnh nhân, người ốm',
        '衛生': 'Vệ sinh',
        '衛星': 'Vệ tinh',
        '自衛': 'Tự vệ',
        '防衛': 'Bảo vệ, phòng thủ',
        '疾病': 'Bệnh tật',
        '疾患': 'Bệnh tật, căn bệnh',
        '臨時': 'Lâm thời, tạm thời',
        '臨床': 'Lâm sàng',
        '注射': 'Tiêm chủng',
        '発射': 'Bắn, phóng xạ',
        '反射': 'Phản quang, phản chiếu',
        '福祉': 'Phúc lợi',
        '文献': 'Văn kiện',
        '貢献': 'Cống hiến; đóng góp',
        '献立': 'Thực đơn; menu',
        '委託': 'Sự ủy thác; sự nhờ làm',
        '宮殿': 'Cung điện, bảo điện',
        '洋梨': 'Quả lê phương Tây',
        '多岐': 'Lạc đề (nói và viết), thác nước',
        '良心': 'Lương tâm',
        '良質': 'Bản chất tốt',
        '改良': 'Cải thiện, cải tiến',
        '道徳': 'Đạo đức',
        '佐渡': '',
        '淡水': 'Nước ngọt',
        '冷淡': 'Thờ ơ, dửng dưng',
        '浜辺': 'Bãi biển, bờ biển',
        '制覇': 'Chinh phục',
        '連覇': 'Giành chiến thắng liên tiếp',
        '世紀': 'Thế kỷ',
        '稲光': 'Tia chớp',
        '稲作': 'Trồng lúa',
        '稲穂': 'Bông lúa',
        '古墳': 'Mộ cổ',
        '聖書': 'Kinh Thánh',
        '神聖': 'Linh thiêng, thiêng liêng',
        '憲法': 'Hiến pháp',
        '派遣': 'Phái đi',
        '立派': 'Có dáng, đàng hoàng, hào hoa, rạng rỡ',
        '派手': 'Bảnh, màu mè, lòe loẹt',
        '遷都': 'Sự dời đô',
        '変遷': 'Sự thăng trầm',
        '資源': 'Tài nguyên',
        '起原': 'Nguồn gốc; khởi nguyên',
        '財源': 'Ngân quỹ, nguồn tài chính',
        '語源': 'Nguồn gốc của từ; từ nguyên',
        '佐藤': 'Tên riêng của người Nhật',
        '加藤': 'Tên riêng của người Nhật',
        '摂政': 'Quan nhiếp chính; chức vụ quan nhiếp chính',
        '摂取': 'Hấp thụ; hấp thu',
        '摂氏': 'Thang chia nhiệt độ Celsius',
        '倉庫': 'Kho hàng, kho; nhà kho',
        '征服': 'Sự chinh phục; chinh phục, xâm chiếm',
        '幕府': 'Mạc phủ',
        '絶滅': 'Hủy diệt, tiêu trừ, triệt hạ',
        '滅亡': 'Diệt vong',
        '漂着': 'Dạt vào',
        '鎖国': 'Bế quan tỏa cảng, biệt lập',
        '連鎖': 'Dây xích, hệ thống, chuỗi',
        '封鎖': 'Phong tỏa',
        '閉鎖': 'Phong bế; phong tỏa, đóng cửa',
        '根拠': 'Căn cứ',
        '拠点': 'Cứ điểm',
        '奉仕': 'Phụng sự',
        '還元': 'Hoàn nguyên (hóa học); hoàn trả (thuế, lợi ích)',
        '返還': 'Trở về; hoàn trả; trả lại',
        '帝国': 'Đế quốc, vương quốc',
        '昭和': 'Thời kỳ Chiêu Hòa'
    }

    // ============== observe ==============
    let domChanged = false;
    const observer = new MutationObserver(mutations => {
        if (!enableInsertRomaji) {
            return;
        }
        if (domChanged) {
            return;
        }
        for (let mutation of mutations) {
            for (let node of mutation.addedNodes) {
                if (excludeTags.has(node.nodeName.toLowerCase())) {
                    continue;
                }
                const parent = node.parentNode;
                if (parent) {
                    if (excludeTags.has(parent.nodeName.toLowerCase())) {
                        continue;
                    }
                    if (parent.classList && parent.classList.contains('chrome-ext-furigana-translation')) {
                        continue;
                    }
                }

                domChanged = true;
                setTimeout(function () {
                    if (!domChanged) {
                        return;
                    }
                    try {
                        scanDocument();
                    } finally {
                        domChanged = false;
                    }
                }, 100);
                return;
            }
        }
    });

    // ============== kuromoji ==============
    const tokenizerPromise = new Promise(function (resolve, reject) {
        kuromoji
            .builder({ dicPath: chrome.runtime.getURL("kuromoji/dict/") })
            .build(function (err, tokenizer) {
                if (tokenizer) {
                    resolve(tokenizer);
                } else {
                    reject(err);
                }
            });
    });
    let tokenizer = null;

    // ============== init ==============
    async function init() {
        const configs = await new Promise(function (resolve) {
            chrome.storage.sync.get(resolve);
        });

        // Load pitch accent cache (merge additional cache if present)
        const storageData = await new Promise(function (resolve) {
            chrome.storage.local.get(['pitchAccentCache', 'pitchAccentCacheAdditional', 'kanjiCache', 'kanjiCacheAdditional'], resolve);
        });
        pitchAccentCache = Object.assign({}, storageData.pitchAccentCache || {}, storageData.pitchAccentCacheAdditional || {});
        kanjiCache = Object.assign({}, storageData.kanjiCache || {}, storageData.kanjiCacheAdditional || {});

        const globalDisabled = configs['globalDisabled'] || false;
        const disabledDomains = configs['disabledDomains'] || [];
        tokenizer = await tokenizerPromise;
        enableInsertRomaji = !(globalDisabled || disabledDomains.includes(location.host) || window.location.hostname.includes('github.com'));
        chrome.runtime.sendMessage({ type: 'current-tab-state-change', content: enableInsertRomaji });
        observer.observe(document, { childList: true, subtree: true });
        const style = document.createElement('style');
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .toast {
                width: 320px;
                padding: 12px 16px;
                border-radius: 8px;
                color: #fff;
                font-size: 34px;
                line-height: 1.4;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);

                opacity: 0;
                transform: translateY(-10px);
                animation: toast-in 0.25s ease forwards;
            }

            .toast.hidden    { display: none; }
            .toast.success   { background: #4caf50; }
            .toast.error     { background: #f44336; }
            .toast.info      { background: #2196f3; }
            .toast.warning   { background: #ff9800; }
            .toast.random1   { background: #ff00d0; }
            .toast.random2   { background: #00ddff; }
            .toast.highlight { background: #f2ff00; }

            .toast.hide {
                animation: toast-out 0.25s ease forwards;
            }

            @keyframes toast-in {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes toast-out {
                to {
                    opacity: 0;
                    transform: translateY(-10px);
                }
            }
            
            div.lln-vertical-view-sub.lln-sentence-wrap.lln-with-play-btn.odd.lln-bigger-item-font.in-scroll.active {
                background-color: yellowgreen !important;
            }

            div.bg-df.box-footer.ng-star-inserted {
                display: none !important;
            }

            [class^="css-"][class*="--DivOverlayBottomContent"] > div > div {
                position: absolute !important;
                top: 2% !important;
                left: 5% !important;
                z-index: 9999 !important;
            }

            [class^="css-"][class*="--DivVideoControlTop"] > div > div {
                position: absolute !important;
                z-index: 9999 !important;
                margin-top: -650px;
                width: 100%;
            }

            [class^="css-"][class*="--DivSecondPartyTagsContainer"], [class^="css-"][class*="--DivMultilineTextContainer"] {
                display: none !important;
            }

            [class^="css-"][class*="--DivVideoClosedCaption"] > ruby {
                font-size: 8px !important;
                color: beige;
            }

            [class^="css-"][class*="--DivVideoClosedCaption"] > ruby > rt {
                font-size: 3rem !important;
            }

            [class^="css-"][class*="--DivMediaCardOverlay"] {
                flex-direction: row-reverse !important;
            }

            [class^="css-"][class*="--DivMediaCardOverlayTop"] {
                flex-direction: column !important;
            }

            [class^="css-"][class*="--DivMediaCardOverlayBottom"] {
                width: 100% !important;
            }

            ytd-transcript-segment-renderer.active .segment.ytd-transcript-segment-renderer {
                background-color: yellowgreen !important;
                font-size: 25px !important;
                line-height: 45px !important;
            }

            .segment.ytd-transcript-segment-renderer {
                font-size: 20px !important;
                line-height: 36px !important;
            }

            .lln-word[data-word-key$=ja] {
                font-size: 3rem;
                line-height: 4.5rem;
            }

            [id^="youTube_transcript_item_"] {
                line-height: 1.6em !important;
            }
        `;
        document.head.appendChild(style);
        if (window.location.hostname.includes("tiktok.com")) {
            const url = new URL(window.location.href);
            if (url.searchParams.get("lang") !== "ja") {
                url.searchParams.set("lang", "ja");
                window.location.replace(url.toString()); // reload with ?lang=ja
            }
        }

        // Define toast container element
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.className = "toast-container";

            document.body.appendChild(container);
            function extractRubyBase(html) {
                const container = document.createElement("div");
                container.innerHTML = html;

                let result = "";

                container.childNodes.forEach(node => {
                    if (node.nodeName === "RUBY") {
                        // get only text nodes (exclude <rt>)
                        node.childNodes.forEach(child => {
                            if (child.nodeType === Node.TEXT_NODE) {
                                result += child.textContent;
                            }
                        });
                    }
                });

                return result;
            }
            document.addEventListener("click", async function (e) {
                const el = e.target.closest(".toast");
                if (!el) return;

                try {
                    e.target.classList.add("hidden");
                    document.querySelectorAll("video, audio").forEach(el => {
                        if (!el.paused) {
                            el.pause();
                        }
                    });
                    window.open("https://github.com/HarryMarch/auto-furigana/edit/main/content-script.js", "_blank");
                    const content = extractRubyBase(el.innerHTML);
                    await navigator.clipboard.writeText(content);

                    // optional: hide after copy
                    // el.classList.add("hidden");

                } catch (err) {
                    console.error("Copy failed:", err);
                }
            });
        }
        // 
        if (enableInsertRomaji) {
            scanDocument();
        }
    }

    init();

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (!message) {
            return;
        }
        switch (message.type) {
            case 'set-enabled': {
                if (enableInsertRomaji !== message.content) {
                    enableInsertRomaji = message.content;
                    chrome.runtime.sendMessage({ type: 'current-tab-state-change', content: enableInsertRomaji });
                    if (enableInsertRomaji) {
                        scanDocument();
                    } else {
                        deleteRubies();
                    }
                }
            }
                break;
            case 'is-enabled-on-tab': {
                sendResponse(enableInsertRomaji);
            }
                break;
            case 'is-actual-enabled': {
                sendResponse(enableInsertRomaji);
            }
                break;
        }
    });

    function deleteRubies() {
        const excludeTags = new Set(['script', 'select', 'textarea']);

        function scanRubyNodes(node) {
            if (excludeTags.has(node.nodeName.toLowerCase())) {
                return;
            }
            if (node.nodeName.toLowerCase() === 'ruby') {
                if (node.classList.contains('chrome-ext-furigana')) {
                    const parent = node.parentNode;
                    const textNode = Array.from(node.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                    if (textNode) {
                        parent.replaceChild(textNode, node);
                    }
                }
                return;
            }
            if (node.hasChildNodes()) {
                node.childNodes.forEach(scanRubyNodes);
            }
        }

        scanRubyNodes(document.body);
    }

    // ============== japanese regexp ==============
    const kanaRegexp = /[ぁ-んァ-ン]/;
    const kanjiRegexp = /[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DB5\u4E00-\u9FCC\uF900-\uFA6D\uFA70-\uFAD9]/;

    function includesKana(text) {
        return kanaRegexp.test(text);
    }

    function includesKanji(text) {
        return kanjiRegexp.test(text);
    }

    function isKatakana(word) {
        return /^[\u30A0-\u30FF]+$/.test(word);
    }

    function isTwoKanji(word) {
        const kanjiRegex = /[\u4E00-\u9FFF]/g;
        const matches = word.match(kanjiRegex);
        return matches && matches.length === word.length && word.length === 2;
    }

    function isJapaneseAdverb(word) {
        if (typeof word !== "string") return false;
        if (word.length < 4 || word.length > 6) return false;

        // Normalize to handle full-width / half-width consistently
        const w = word.trim();

        // Pattern 1: repetition like ゴロゴロ / ごちゃごちゃ
        // Matches 2+ characters repeated twice
        const repetitionPattern = /^(.{1,3})\1$/;

        // Pattern 2: small tsu (っ or ッ) as second character
        const smallTsuPattern = /^.([っッ]).+/;

        return repetitionPattern.test(w) || smallTsuPattern.test(w);
    }

    // ============== ordered toast queue ==============

    const orderedToastQueue = [];
    let nextToastIndex = 0;

    // Track active (visible) toasts
    const activeToasts = new Set();

    // Current caption/sentence group
    let currentToastGroup = null;
    let toastGroupCounter = 0;

    /**
     * Remove all visible toasts immediately.
     *
     * This is called when a new caption sentence starts.
     */
    function clearPreviousSentenceToasts() {
        const container = document.getElementById("toast-container");

        if (container) {
            container.querySelectorAll(".toast").forEach(toast => {
                toast.remove();
            });
        }

        activeToasts.clear();

        // Invalidate the old queue.
        orderedToastQueue.length = 0;
        nextToastIndex = 0;
    }

    /**
     * Start a new sentence/caption toast group.
     *
     * Every sentence gets its own queue.
     */
    function startToastGroup(groupKey) {

        // Same sentence -> keep using the existing queue.
        if (currentToastGroup && currentToastGroup.key === groupKey) {
            return currentToastGroup;
        }

        // New sentence -> remove previous sentence's toasts.
        clearPreviousSentenceToasts();

        currentToastGroup = {
            id: ++toastGroupCounter,
            key: groupKey
        };

        return currentToastGroup;
    }

    /**
     * Reserve a position in the current sentence's toast sequence.
     */
    function reserveToastSlot(group) {

        // Do not allow an old sentence to reserve new slots.
        if (!currentToastGroup || group.id !== currentToastGroup.id) {
            return -1;
        }

        const index = orderedToastQueue.length;

        orderedToastQueue.push({
            status: 'pending',
            message: null,
            type: null,
            duration: 2500,
            key: null,
            groupId: group.id
        });

        return index;
    }

    /**
     * Complete a reserved slot.
     */
    function completeToastSlot(
        index,
        message,
        type = 'info',
        duration = 2500,
        group = null
    ) {
        if (index < 0) {
            return;
        }

        const slot = orderedToastQueue[index];

        if (!slot || slot.status !== 'pending') {
            return;
        }

        // Translation belongs to an old sentence.
        if (
            !currentToastGroup ||
            !group ||
            group.id !== currentToastGroup.id ||
            slot.groupId !== currentToastGroup.id
        ) {
            slot.status = 'cancelled';
            return;
        }

        const key = `${type}|${message}`;

        // Skip duplicate toasts inside the current sentence.
        const duplicate =
            orderedToastQueue.some((t, i) =>
                i !== index &&
                t.status === 'completed' &&
                t.key === key
            ) ||
            activeToasts.has(key);

        if (duplicate) {
            slot.status = 'skipped';
        } else {
            slot.status = 'completed';
            slot.message = message;
            slot.type = type;
            slot.duration = duration;
            slot.key = key;
        }

        processOrderedToasts();
    }

    /**
     * Process completed translations in their original order.
     *
     * Only processes the current sentence.
     */
    function processOrderedToasts() {

        while (nextToastIndex < orderedToastQueue.length) {

            const slot = orderedToastQueue[nextToastIndex];

            // Safety: ignore slots from an old sentence.
            if (
                !currentToastGroup ||
                slot.groupId !== currentToastGroup.id
            ) {
                nextToastIndex++;
                continue;
            }

            // Translation hasn't completed yet.
            if (slot.status === 'pending') {
                return;
            }

            nextToastIndex++;

            if (
                slot.status === 'skipped' ||
                slot.status === 'cancelled'
            ) {
                continue;
            }

            showToastElement(slot);
        }
    }

    function showToastElement({ message, type, duration, key, groupId }) {

        // Don't display an old sentence.
        if (
            !currentToastGroup ||
            groupId !== currentToastGroup.id
        ) {
            return;
        }

        const container = document.getElementById("toast-container");

        if (!container) {
            return;
        }

        const toast = document.createElement("div");

        toast.className = `toast ${type}`;
        toast.innerHTML = message;

        // Store group ID directly on the DOM element.
        toast.dataset.toastGroup = String(groupId);

        container.appendChild(toast);

        activeToasts.add(key);

        setTimeout(() => {

            // Toast may already have been removed
            // because a new sentence arrived.
            if (!toast.isConnected) {
                activeToasts.delete(key);
                return;
            }

            toast.classList.add("hide");

            setTimeout(() => {

                if (toast.isConnected) {
                    toast.remove();
                }

                activeToasts.delete(key);

            }, 250);

        }, duration);
    }

    function includesJapanese(text) {
        return includesKana(text) || includesKanji(text);
    }

    function addJapaneseTokenToStorage(accent) {
        chrome.storage.local.get(['japaneseToken'], function (result) {
            const japaneseToken = typeof result.japaneseToken === 'string' ? result.japaneseToken : '';
            chrome.storage.local.set({ japaneseToken: japaneseToken + accent + ';' });
        });
    }

    // ============== check is page chinese ==============
    let isPageChinese = false;
    if (document.documentElement.lang.includes('zh')) {
        isPageChinese = true;
    } else {
        const pageText = document.body.innerText;
        const matchKana = pageText.match(/[ぁ-んァ-ン]/g);
        const kanaNum = matchKana ? matchKana.length : 0;
        const matchChinese = pageText.match(/[\u3400-\u4DBF\u4E00-\u9FEF\u20000-\u2EBFF]/g);
        const chineseNum = matchChinese ? matchChinese.length : 0;
        isPageChinese = chineseNum && (kanaNum / chineseNum < 0.02);
    }
    if (window.location.hostname.includes('youtube.com') || window.location.hostname.includes('tiktok.com')) {
        isPageChinese = false;
    }

    // ============== scan document ==============
    const captionClassNames = [
        'DivVideoClosedCaption',
        'ytp-caption-segment',
    ];
    function scanDocument() {
        const stack = [document.body];
        const textNodes = [];
        for (; ;) {
            const node = stack.shift();
            if (!node) {
                break;
            }
            if (node.classList && node.classList.contains('chrome-ext-furigana-translation')) {
                continue;
            }
            if (node.hasChildNodes()) {
                const childNodes = node.childNodes;
                for (let i = 0, len = childNodes.length; i < len; ++i) {
                    const child = childNodes.item(i);
                    if (!excludeTags.has(child.nodeName.toLowerCase())) {
                        stack.push(child);
                    }
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
            }
        }
        for (let i = 0, len = textNodes.length; i < len; ++i) {
            createRuby(textNodes[i]);
        }
    }

    // ============== create ruby ==============
    const specialCases = {
        'た': 'TA',
        'てる': 'TÊRƯ',
        'する': 'SƯRƯ',
        'れる': 'RÊRƯ',
        'ある': 'ARƯ',
        'できる': 'ĐỀKIRƯ',
        'さ': 'SA',
    }
    const specialCaseKeys = Object.keys(specialCases);
    async function createRuby(node) {
        const text = node.nodeValue;
        if (!(
            isPageChinese && includesKana(text) // prevent treating chinese as japanese kanji
            || !isPageChinese && includesJapanese(text)
        )) {
            return;
        }
        const tokens = tokenizer.tokenize(text);
        if (!tokens) {
            return;
        }
        if (!enableInsertRomaji) {
            return;
        }
        const parent = node.parentNode;
        if (!parent) {
            return;
        }
        for (let i = 0, len = tokens.length; i < len; ++i) {
            const token = tokens[i];
            const isCaption = node.parentNode && node.parentNode.className && captionClassNames.some(cls => node.parentNode.className.includes(cls));
            const isWhiteListedNoun = token.pos === "名詞" && token.surface_form.length === 2 && !/^[ぁ-んァ-ヶー]{2}$/.test(token.surface_form);
            const isBlackListed = BLACK_LISTED_WORDS.has(token.basic_form);
            const isAdverb = isJapaneseAdverb(token.surface_form) || token.pos === "副詞";
            const isVerb = token.pos === "動詞" && token.surface_form.length > 1;
            const willShowToast = isCaption && (isWhiteListedNoun
                || isBlackListed || isAdverb || isVerb) && !COMMON_WORDS.has(token.surface_form);
            const highlightClass = isVerb ? 'error' : highlightClasses[Math.floor(Math.random() * highlightClasses.length)];
            if (willShowToast) {

                /*
                 * Identify the current caption sentence.
                 *
                 * The caption element itself is the most reliable grouping
                 * mechanism because all words belonging to the same caption
                 * normally share the same parent.
                 */
                const captionElement = node.parentNode;

                /*
                 * Use the caption element itself as the group identity.
                 *
                 * WeakMap isn't necessary here because we only need the
                 * current group.
                 */
                const groupKey = captionElement;

                const toastGroup = startToastGroup(groupKey);

                // Reserve the original position BEFORE starting translation.
                const toastIndex = reserveToastSlot(toastGroup);

                const targetLang = isWhiteListedNoun ? 'vi' : 'en';
                const word = token.surface_form;

                const pronunciation = token.pronunciation
                    ? japanese.romanize(token.pronunciation).toLowerCase()
                    : '';

                const nghia = KANJIS[word];
                if (nghia) {
                    completeToastSlot(
                        toastIndex,
                        word + '<br>' + nghia,
                        highlightClass,
                        2500,
                        toastGroup
                    );
                } else {
                    googleTranslate('ja', targetLang, word)
                        .then((meaning) => {

                            /*
                             * IMPORTANT:
                             *
                             * The user may already have moved to another sentence
                             * while this translation was still pending.
                             *
                             * completeToastSlot() will therefore ignore this result
                             * if it belongs to the old sentence.
                             */

                            // Handle an empty or invalid translation.
                            if (typeof meaning !== 'string' || !meaning.trim()) {
                                completeToastSlot(
                                    toastIndex,
                                    null,
                                    'info',
                                    2500,
                                    toastGroup
                                );
                                return;
                            }

                            // Do not show toast when translation equals pronunciation.
                            if (meaning.toLowerCase() === pronunciation) {
                                completeToastSlot(
                                    toastIndex,
                                    null,
                                    'info',
                                    2500,
                                    toastGroup
                                );
                                return;
                            }

                            meaning = meaning
                                .replace('tính từ ', '')
                                .replace('danh từ ', '')
                                .replace('trạng từ ', '')
                                .replace('động từ ', '');

                            const TOO_LONG = 50;

                            if (meaning.length > TOO_LONG) {
                                meaning = meaning.substring(0, TOO_LONG) + '...';
                            }

                            completeToastSlot(
                                toastIndex,
                                word + '<br>' + meaning,
                                highlightClass,
                                2500,
                                toastGroup
                            );
                        })
                        .catch((error) => {

                            console.error(
                                'Translation failed:',
                                word,
                                error
                            );

                            // Release this position even if the request fails.
                            completeToastSlot(
                                toastIndex,
                                null,
                                'info',
                                2500,
                                toastGroup
                            );
                        });
                }
            }

            let dom;
            if (includesKana(token.pronunciation) || includesJapanese(token.surface_form)) {
                dom = document.createElement('ruby');
                dom.classList.add('chrome-ext-furigana');
                willShowToast && dom.classList.add(`color-${highlightClass}`);
                dom.appendChild(document.createTextNode(token.surface_form));
                const rt = document.createElement('rt');
                if (pitchAccentCache[token.surface_form] && includesJapanese(pitchAccentCache[token.surface_form])) {
                    addJapaneseTokenToStorage(pitchAccentCache[token.surface_form]);
                }
                const nextWord = ((tokens[i + 1] || {}).surface_form || '');
                const baseCase = pitchAccentCache[token.surface_form] || japanese.romanize(
                    includesKana(token.pronunciation) ? token.pronunciation : token.surface_form
                );
                if ((specialCaseKeys.includes(token.surface_form) && (nextWord.startsWith('ん')) || nextWord.startsWith('っ')) || (token.surface_form === 'さ' && ['れ', 'せ', 'れる'].includes(nextWord))) {
                    rt.textContent = specialCases[token.surface_form] || baseCase;
                } else {
                    rt.textContent = baseCase;
                }
                dom.appendChild(rt);
            } else {
                dom = document.createTextNode(token.surface_form);
            }

            if (i === 0) {
                parent.replaceChild(dom, node);
            } else {
                node.after(dom);
            }
            node = dom;
        }
    }

    // ============== google translate ==============
    const googleTranslateCache = {};

    function googleTranslate(sLang, tLang, text) {
        text = (text || '').trim();
        const hash = `${tLang}/${text}`
        if (googleTranslateCache.hasOwnProperty(hash)) {
            return googleTranslateCache[hash];
        }
        return googleTranslateCache[hash] = new Promise(function (resolve) {
            const url = `https://clients5.google.com/translate_a/single?dj=1&dt=t&dt=sp&dt=ld&dt=bd&client=dict-chrome-ex&sl=${sLang}&tl=${tLang}&q=${encodeURIComponent(text)}`;
            chrome.runtime.sendMessage({ type: 'fetch-json', content: url }, function (meaning) {
                resolve(meaning);
            });
        });
    }

    // ============== translation ==============
    const translationDom = document.createElement('div');
    translationDom.classList.add('chrome-ext-furigana-translation');
    document.body.appendChild(translationDom);

    // ============== get mouseover ruby ==============
    let currHoverNode = null;
    document.addEventListener('mouseover', async function (e) {
        translationDom.classList.remove('show');
        let node = e.target;
        if (!node) {
            return;
        }
        if (node.nodeName.toLowerCase() === 'rt') {
            node = node.parentNode;
        }
        currHoverNode = node;
        if (node.nodeName.toLowerCase() === 'ruby'
            && node.classList.contains('chrome-ext-furigana')
        ) {
            const configs = await new Promise(function (resolve) {
                chrome.storage.sync.get(resolve);
            });
            if (configs['translationDisabled']) {
                return;
            }

            await new Promise(function (resolve) {
                setTimeout(resolve, 200);
            });

            if (currHoverNode !== node) {
                return;
            }
            const textNode = Array.from(node.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (!textNode) {
                return;
            }
            const text = textNode.data || '';
            const meaning = await googleTranslate('ja', configs['targetLang'] || 'en', text);
            let kanjiInfo = '';
            text.split('').forEach(char => {
                if (kanjiCache[char]) {
                    kanjiInfo += char + ': ' + kanjiCache[char] + '<br>';
                }
            });
            if (meaning) {
                translationDom.innerHTML = (kanjiInfo ? kanjiInfo + '<br>' : '') + meaning;
            } else {
                return;
            }

            const rect = node.getBoundingClientRect();
            translationDom.style.top = (rect.bottom + 2) + 'px';
            translationDom.style.left = rect.left + 'px';
            translationDom.classList.add('show');
        }
    });

    document.addEventListener('scroll', function () {
        translationDom.classList.remove('show');
    });
})();
