
import { db } from "@/lib/app-infrastructure/database";
import { docs } from "@/lib/app-infrastructure/database/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("🌱 Seeding FAQ and Terms of Use content...");

    const faqContent = {
        az: {
            title: "Tez-tez Verilən Suallar (FAQ)",
            content: `
                <div class="faq-container">
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">1. STUWIN nədir?</h3>
                        <p>STUWIN, süni intellekt əsaslı anlayışlar və strukturlaşdırılmış kurikulum idarəçiliyi vasitəsilə öyrənməni təkmilləşdirmək üçün hazırlanmış qabaqcıl təhsil platformasıdır.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">2. Necə qeydiyyatdan keçmək olar?</h3>
                        <p>Yuxarı sağ küncdəki "Qeydiyyat" düyməsini sıxaraq və təlimatları izləyərək qeydiyyatdan keçə bilərsiniz.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">3. Necə ödəniş etmək olar?</h3>
                        <p>Təhlükəsiz ödəniş şlüzümüz vasitəsilə kredit kartları daxil olmaqla müxtəlif ödəniş üsullarını dəstəkləyirik.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">4. Tədris materiallarına necə daxil olmaq olar?</h3>
                        <p>Proqrama daxil olduqdan sonra materiallara tələbə paneli vasitəsilə daxil ola bilərsiniz.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">5. Dəstək xidməti ilə necə əlaqə saxlamaq olar?</h3>
                        <p>Əlaqə səhifəsi vasitəsilə və ya support@stuwin.az elektron poçt ünvanına yazaraq bizimlə əlaqə saxlaya bilərsiniz.</p>
                    </div>
                </div>
            `
        },
        en: {
            title: "Frequently Asked Questions (FAQ)",
            content: `
                <div class="faq-container">
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">1. What is STUWIN?</h3>
                        <p>STUWIN is an advanced educational platform designed to enhance learning through AI-driven insights and structured curriculum management.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">2. How to register?</h3>
                        <p>You can register by clicking the "Sign Up" button on the top right corner and following the onboarding process.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">3. How to pay?</h3>
                        <p>We support various payment methods including credit cards via our secure payment gateway.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">4. How to access learning materials?</h3>
                        <p>Once you're enrolled in a program, you can access materials via your student dashboard.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">5. How to contact support?</h3>
                        <p>You can reach us via the Contact page or email us at support@stuwin.az.</p>
                    </div>
                </div>
            `
        },
        ru: {
            title: "Часто задаваемые вопросы (FAQ)",
            content: `
                <div class="faq-container">
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">1. Что такое STUWIN?</h3>
                        <p>STUWIN — это передовая образовательная платформа, предназначенная для улучшения обучения с помощью идей на основе ИИ и структурированного управления учебными программами.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">2. Как зарегистрироваться?</h3>
                        <p>Вы можете зарегистрироваться, нажав кнопку «Регистрация» в правом верхнем углу и следуя процессу адаптации.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">3. Как оплатить?</h3>
                        <p>Мы поддерживаем различные способы оплаты, включая кредитные карты, через наш безопасный платежный шлюз.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">4. Как получить доступ к учебным материалам?</h3>
                        <p>После зачисления на программу вы сможете получить доступ к материалам через панель управления студента.</p>
                    </div>
                    <div class="faq-item mb-6">
                        <h3 class="text-xl font-bold mb-2">5. Как связаться с техподдержкой?</h3>
                        <p>Вы можете связаться с нами через страницу «Контакты» или написать нам по адресу support@stuwin.az.</p>
                    </div>
                </div>
            `
        }
    };

    const termsContent = {
        az: {
            title: "İstifadə Şərtləri",
            content: `
                <div class="terms-container prose">
                    <h2>1. Giriş</h2>
                    <p>STUWIN platformasına xoş gəlmisiniz. Bu şərtlər bizim xidmətlərimizdən istifadənizi tənzimləyir.</p>
                    <h2>2. Şərtlərin Qəbulu</h2>
                    <p>Platformadan istifadə edərək bu şərtlərlə tam razılaşdığınızı təsdiq edirsiniz.</p>
                    <h2>3. İstifadəçi Hesabları</h2>
                    <p>Hesabınızın məxfiliyini qorumaq Sizin məsuliyyətinizdir.</p>
                    <h2>4. Əqli Mülkiyyət</h2>
                    <p>STUWIN platformasındakı bütün məzmun və texnologiyalar bizim mülkiyyətimizdir.</p>
                    <h2>5. Məsuliyyətin Məhdudlaşdırılması</h2>
                    <p>Xidmətlərimiz "olduğu kimi" təqdim olunur və biz istifadədən yaranan hər hansı bir qeyri-birbaşa zərərə görə məsuliyyət daşımırıq.</p>
                    <h2>6. Şərtlərdə Dəyişikliklər</h2>
                    <p>Biz bu şərtləri istənilən vaxt yeniləmək hüququnu özümüzdə saxlayırıq.</p>
                    <h2>7. Əlaqə</h2>
                    <p>Suallarınız yaranarsa, support@stuwin.az ünvanına müraciət edin.</p>
                </div>
            `
        },
        en: {
            title: "Terms of Use",
            content: `
                <div class="terms-container prose">
                    <h2>1. Introduction</h2>
                    <p>Welcome to the STUWIN platform. These terms govern your use of our services.</p>
                    <h2>2. Acceptance of Terms</h2>
                    <p>By using the platform, you agree to comply with these terms in full.</p>
                    <h2>3. User Accounts</h2>
                    <p>You are responsible for maintaining the confidentiality of your account.</p>
                    <h2>4. Intellectual Property</h2>
                    <p>All content and technology on STUWIN are our property.</p>
                    <h2>5. Limitation of Liability</h2>
                    <p>Our services are provided "as is", and we are not liable for any indirect damages resulting from use.</p>
                    <h2>6. Changes to Terms</h2>
                    <p>We reserve the right to update these terms at any time.</p>
                    <h2>7. Contact</h2>
                    <p>If you have any questions, please contact support@stuwin.az.</p>
                </div>
            `
        },
        ru: {
            title: "Условия использования",
            content: `
                <div class="terms-container prose">
                    <h2>1. Введение</h2>
                    <p>Добро пожаловать на платформу STUWIN. Эти условия регулируют использование вами наших услуг.</p>
                    <h2>2. Принятие условий</h2>
                    <p>Используя платформу, вы подтверждаете свое полное согласие с этими условиями.</p>
                    <h2>3. Учетные записи пользователей</h2>
                    <p>Вы несете ответственность за сохранение конфиденциальности вашей учетной записи.</p>
                    <h2>4. Интеллектуальная собственность</h2>
                    <p>Весь контент и технологии на STUWIN являются нашей собственностью.</p>
                    <h2>5. Ограничение ответственности</h2>
                    <p>Наши услуги предоставляются «как есть», и мы не несем ответственности за любой косвенный ущерб в результате использования.</p>
                    <h2>6. Изменения в условиях</h2>
                    <p>Мы оставляем за собой право обновлять эти условия в любое время.</p>
                    <h2>7. Контактная информация</h2>
                    <p>Если у вас есть вопросы, свяжитесь с нами по адресу support@stuwin.az.</p>
                </div>
            `
        }
    };

    // Upsert FAQ
    console.log("Upserting FAQ...");
    const existingFaq = await db.select().from(docs).where(eq(docs.type, "faq")).limit(1);
    if (existingFaq.length > 0) {
        await db.update(docs).set({ localizedContent: faqContent, updatedAt: new Date() }).where(eq(docs.type, "faq"));
    } else {
        await db.insert(docs).values({ type: "faq", localizedContent: faqContent });
    }

    // Upsert Terms
    console.log("Upserting Terms...");
    const existingTerms = await db.select().from(docs).where(eq(docs.type, "terms")).limit(1);
    if (existingTerms.length > 0) {
        await db.update(docs).set({ localizedContent: termsContent, updatedAt: new Date() }).where(eq(docs.type, "terms"));
    } else {
        await db.insert(docs).values({ type: "terms", localizedContent: termsContent });
    }

    console.log("✅ Seeding completed!");
    process.exit(0);
}

main().catch(err => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
